package edu.cit.daal.techtrack.service;

import edu.cit.daal.techtrack.exception.BusinessRuleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.UUID;

@Service
public class ProfileStorageService {

    @Value("${upload.profiles.dir:./uploads/profiles}")
    private String profilesDir;

    private Path rootPath;

    @PostConstruct
    public void init() {
        rootPath = Paths.get(profilesDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootPath);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create profiles directory: " + rootPath, e);
        }
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new BusinessRuleException("VALID-003", "File is empty");
        if (file.getSize() > 5 * 1024 * 1024)
            throw new BusinessRuleException("VALID-004", "File exceeds 5 MB");

        String ct = file.getContentType();
        if (!"image/jpeg".equals(ct) && !"image/png".equals(ct))
            throw new BusinessRuleException("VALID-003", "Only JPEG and PNG are allowed");

        try (InputStream in = file.getInputStream()) {
            byte[] h = in.readNBytes(4);
            boolean jpg = h.length >= 2 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8;
            boolean png = h.length >= 4 && (h[0] & 0xFF) == 0x89 && (h[1] & 0xFF) == 0x50
                    && (h[2] & 0xFF) == 0x4E && (h[3] & 0xFF) == 0x47;
            if (!jpg && !png) throw new BusinessRuleException("VALID-003", "Invalid image content");
        } catch (IOException e) {
            throw new IllegalStateException("Could not read file bytes", e);
        }

        String ext = getExt(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Path dest = rootPath.resolve(filename).normalize();
        if (!dest.startsWith(rootPath))
            throw new BusinessRuleException("BUSINESS-003", "Invalid file path");

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store profile picture", e);
        }
        return filename;
    }

    public Path resolve(String filename) {
        Path file = rootPath.resolve(filename).normalize();
        if (!file.startsWith(rootPath))
            throw new BusinessRuleException("BUSINESS-003", "Invalid file path");
        return file;
    }

    private String getExt(String name) {
        if (name == null) return ".bin";
        int dot = name.lastIndexOf('.');
        return dot >= 0 ? name.substring(dot).toLowerCase() : ".bin";
    }
}
