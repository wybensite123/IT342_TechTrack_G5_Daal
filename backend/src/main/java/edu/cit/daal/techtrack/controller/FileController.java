package edu.cit.daal.techtrack.controller;

import edu.cit.daal.techtrack.service.FileStorageService;
import edu.cit.daal.techtrack.service.ProfileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;

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
