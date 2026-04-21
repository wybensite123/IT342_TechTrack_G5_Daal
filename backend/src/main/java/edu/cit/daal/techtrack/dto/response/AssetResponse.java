package edu.cit.daal.techtrack.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AssetResponse {

    private Long id;
    private String name;
    private String category;
    private String description;
    private String serialNumber;
    private String assetTag;
    private String status;
    private List<ImageDto> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class ImageDto {
        private Long id;
        private String filePath;
        private boolean primary;
    }
}
