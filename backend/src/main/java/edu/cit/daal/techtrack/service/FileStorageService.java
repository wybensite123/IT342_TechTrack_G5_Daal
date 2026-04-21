package edu.cit.daal.techtrack.service;

import edu.cit.daal.techtrack.exception.BusinessRuleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${upload.dir:./uploads/assets}")
    private String uploadDir;

    private Path rootPath;

    @PostConstruct
    public void init() {
        rootPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootPath);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + rootPath, e);
        }
    }

    public String store(MultipartFile file) {
        validateFile(file);

        String ext = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Path destination = rootPath.resolve(filename).normalize();

        // Path traversal guard
        if (!destination.startsWith(rootPath)) {
            throw new BusinessRuleException("BUSINESS-003", "Invalid file path");
        }

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file", e);
        }

        return filename;
    }

    public Path resolve(String filename) {
        Path file = rootPath.resolve(filename).normalize();
        if (!file.startsWith(rootPath)) {
            throw new BusinessRuleException("BUSINESS-003", "Invalid file path");
        }
        return file;
    }

    // ── Validation ────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("VALID-003", "File is empty");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BusinessRuleException("VALID-004", "File exceeds 5MB size limit");
        }

        String contentType = file.getContentType();
        if (!"image/jpeg".equals(contentType) && !"image/png".equals(contentType)) {
            throw new BusinessRuleException("VALID-003", "Only JPEG and PNG images are allowed");
        }

        // Validate magic bytes
        try (InputStream in = file.getInputStream()) {
            byte[] header = in.readNBytes(4);
            if (!isJpeg(header) && !isPng(header)) {
                throw new BusinessRuleException("VALID-003", "File content does not match a valid image type");
            }
        } catch (IOException e) {
            throw new IllegalStateException("Could not read file bytes", e);
        }
    }

    private boolean isJpeg(byte[] h) {
        return h.length >= 2 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8;
    }

    private boolean isPng(byte[] h) {
        return h.length >= 4
                && (h[0] & 0xFF) == 0x89
                && (h[1] & 0xFF) == 0x50
                && (h[2] & 0xFF) == 0x4E
                && (h[3] & 0xFF) == 0x47;
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null) return ".bin";
        String clean = StringUtils.cleanPath(originalFilename);
        int dot = clean.lastIndexOf('.');
        return dot >= 0 ? clean.substring(dot).toLowerCase() : ".bin";
    }
}
