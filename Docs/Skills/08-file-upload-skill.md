# Skill: Asset Image File Upload
**Project:** TechTrack Inventory System  
**Stack:** Spring Boot 3.x, Java 17, PostgreSQL

---

## Overview
This skill governs all image upload functionality for TechTrack assets. Images are stored on the server filesystem (not in the database). Only the file path is stored in the `asset_images` table. All uploads must be validated before saving.

---

## Constraints

| Property | Rule |
|----------|------|
| Allowed MIME Types | `image/jpeg`, `image/png` only |
| Maximum File Size | 5MB per file |
| Max Files Per Asset | No hard limit, but enforce via UI |
| Storage Location | Server filesystem — configured via `file.upload-dir` env variable |
| DB Storage | Only file path stored in `asset_images.file_path` |
| Filename | UUID-based to prevent collisions and path traversal |
| Access | Served via `/api/v1/files/{filename}` endpoint |
| Auth Required | Yes — must be authenticated to access images |

---

## application.properties
```properties
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=10MB
file.upload-dir=${UPLOAD_DIR:./uploads/assets}
```

---

## File Storage Service

```java
@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_MIME_TYPES =
        List.of("image/jpeg", "image/png");
    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    public String storeFile(MultipartFile file) {
        // 1. Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new BusinessRuleException("VALID-003",
                "Invalid file type. Only JPEG and PNG are allowed.");
        }

        // 2. Validate file size
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new BusinessRuleException("VALID-004",
                "File size exceeds the 5MB limit.");
        }

        // 3. Re-verify magic bytes (do not trust Content-Type header alone)
        validateMagicBytes(file);

        // 4. Generate safe filename (UUID + original extension)
        String originalFilename = StringUtils.cleanPath(
            Objects.requireNonNull(file.getOriginalFilename())
        );
        String extension = getExtension(originalFilename);
        String newFilename = UUID.randomUUID().toString() + "." + extension;

        // 5. Ensure upload directory exists
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            try {
                Files.createDirectories(uploadPath);
            } catch (IOException e) {
                throw new SystemException("SYSTEM-001", "Failed to create upload directory");
            }
        }

        // 6. Save file
        Path targetPath = uploadPath.resolve(newFilename);
        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new SystemException("SYSTEM-001", "Failed to store file");
        }

        // 7. Return relative path for DB storage
        return "assets/" + newFilename;
    }

    public void deleteFile(String filePath) {
        try {
            Path path = Paths.get(uploadDir).getParent().resolve(filePath);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            // Log but don't throw — file cleanup should not fail the business operation
        }
    }

    private void validateMagicBytes(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[4];
            is.read(header);

            boolean isJpeg = header[0] == (byte) 0xFF && header[1] == (byte) 0xD8;
            boolean isPng = header[0] == (byte) 0x89 && header[1] == (byte) 0x50
                         && header[2] == (byte) 0x4E && header[3] == (byte) 0x47;

            if (!isJpeg && !isPng) {
                throw new BusinessRuleException("VALID-003",
                    "File content does not match a valid JPEG or PNG image.");
            }
        } catch (IOException e) {
            throw new BusinessRuleException("VALID-003", "Could not read file for validation.");
        }
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0) return "jpg"; // default
        String ext = filename.substring(dotIndex + 1).toLowerCase();
        return ext.matches("jpg|jpeg|png") ? ext : "jpg";
    }
}
```

---

## Upload Endpoint (Controller)

```java
@PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ApiResponse<AssetImageResponse>> uploadImage(
        @PathVariable UUID id,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "isPrimary", defaultValue = "false") boolean isPrimary) {

    AssetImageResponse response = assetService.addImage(id, file, isPrimary);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponseBuilder.success(response));
}
```

---

## Asset Service — Add Image

```java
@Transactional
public AssetImageResponse addImage(UUID assetId, MultipartFile file, boolean isPrimary) {

    Asset asset = assetRepository.findById(assetId)
        .orElseThrow(() -> new ResourceNotFoundException("DB-001", "Asset not found"));

    // Store file on disk
    String filePath = fileStorageService.storeFile(file);

    // If this is marked primary, unmark any existing primary
    if (isPrimary) {
        assetImageRepository.clearPrimaryForAsset(assetId);
    }

    AssetImage image = AssetImage.builder()
        .asset(asset)
        .filePath(filePath)
        .isPrimary(isPrimary)
        .build();

    AssetImage saved = assetImageRepository.save(image);
    return assetImageMapper.toResponse(saved);
}
```

---

## File Serving Endpoint

Serve uploaded images through a secured endpoint:

```java
@GetMapping("/files/{filename:.+}")
public ResponseEntity<Resource> serveFile(@PathVariable String filename) {

    Path filePath = Paths.get(uploadDir).resolve(filename).normalize();

    // Prevent path traversal
    if (!filePath.startsWith(Paths.get(uploadDir).normalize())) {
        return ResponseEntity.badRequest().build();
    }

    try {
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = Files.probeContentType(filePath);
        if (contentType == null) contentType = "application/octet-stream";

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + resource.getFilename() + "\"")
            .body(resource);

    } catch (IOException e) {
        return ResponseEntity.internalServerError().build();
    }
}
```

---

## AssetImage Repository Query

```java
public interface AssetImageRepository extends JpaRepository<AssetImage, UUID> {

    List<AssetImage> findByAssetId(UUID assetId);

    Optional<AssetImage> findByAssetIdAndIsPrimaryTrue(UUID assetId);

    @Modifying
    @Query("UPDATE AssetImage ai SET ai.isPrimary = false WHERE ai.asset.id = :assetId")
    void clearPrimaryForAsset(@Param("assetId") UUID assetId);
}
```

---

## Security Rules for File Upload

- Only `ROLE_ADMIN` can upload or delete images
- Validate MIME type from **both** `Content-Type` header AND magic bytes — never trust headers alone
- Use UUID filenames — never use the original filename for storage
- Never expose the absolute filesystem path in API responses — return relative paths only
- Always sanitize filenames with `StringUtils.cleanPath()` before processing
- Path traversal check: ensure resolved path starts with the upload directory
- Images are accessible to any authenticated user via the `/files/{filename}` endpoint

---

## Frontend: Image Upload (React)

```typescript
const uploadImage = async (assetId: string, file: File, isPrimary: boolean) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('isPrimary', String(isPrimary));

  const response = await axios.post(
    `/api/v1/assets/${assetId}/images`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
};
```

Client-side validation before upload:
```typescript
const validateImage = (file: File): string | null => {
  const allowed = ['image/jpeg', 'image/png'];
  if (!allowed.includes(file.type)) return 'Only JPEG and PNG files are allowed';
  if (file.size > 5 * 1024 * 1024) return 'File must be under 5MB';
  return null;
};
```

---

## Mobile: Image Upload (Kotlin Android)

```kotlin
suspend fun uploadAssetImage(assetId: String, imageUri: Uri, isPrimary: Boolean): AssetImageResponse {
    val file = File(getRealPathFromUri(context, imageUri))
    val requestFile = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
    val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
    val isPrimaryPart = isPrimary.toString().toRequestBody("text/plain".toMediaTypeOrNull())

    return apiService.uploadImage(assetId, body, isPrimaryPart)
}
```
