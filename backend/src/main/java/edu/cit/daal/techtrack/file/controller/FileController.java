package edu.cit.daal.techtrack.file.controller;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.cit.daal.techtrack.file.service.FileStorageService;
import edu.cit.daal.techtrack.profile.service.ProfileStorageService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;
    private final ProfileStorageService profileStorageService;

    /** Serve asset images */
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        return serve(fileStorageService.resolve(filename), filename);
    }

    /** Serve profile pictures */
    @GetMapping("/profiles/{filename:.+}")
    public ResponseEntity<Resource> serveProfileFile(@PathVariable String filename) {
        return serve(profileStorageService.resolve(filename), filename);
    }

    private ResponseEntity<Resource> serve(Path file, String filename) {
        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = "application/octet-stream";
            try {
                contentType = java.nio.file.Files.probeContentType(file);
                if (contentType == null) contentType = "application/octet-stream";
            } catch (IOException ignored) { }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
