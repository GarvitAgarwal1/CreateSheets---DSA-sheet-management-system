package com.iqms.backend.dto.sheet;

import jakarta.validation.constraints.Size;

public class SheetCreateRequest {

  @Size(max = 120, message = "Title must be 120 characters or fewer")
  private String title;
  @Size(max = 2048, message = "Logo URL must be 2048 characters or fewer")
  private String logoUrl;
  @Size(max = 2048, message = "Sheet URL must be 2048 characters or fewer")
  private String sheetUrl;

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getLogoUrl() {
    return logoUrl;
  }

  public void setLogoUrl(String logoUrl) {
    this.logoUrl = logoUrl;
  }

  public String getSheetUrl() {
    return sheetUrl;
  }

  public void setSheetUrl(String sheetUrl) {
    this.sheetUrl = sheetUrl;
  }
}
