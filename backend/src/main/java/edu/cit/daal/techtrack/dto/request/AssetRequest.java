package edu.cit.daal.techtrack.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssetRequest {

    @NotBlank(message = "Asset name is required")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    private String description;

    private String serialNumber;

    @NotBlank(message = "Asset tag is required")
    private String assetTag;
}
