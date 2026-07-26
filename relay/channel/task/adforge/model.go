package adforge

// Upstream request for POST /api/v1/images/generations.
//
// Adforge describes aspect ratio and pixel density as two separate fields
// (size + resolution) rather than OpenAI's single "1024x1024" size string.
type submitRequest struct {
	Prompt              string   `json:"prompt"`
	Model               string   `json:"model,omitempty"`
	Size                string   `json:"size,omitempty"`
	Resolution          string   `json:"resolution,omitempty"`
	Quality             string   `json:"quality,omitempty"`
	ImageCount          int      `json:"image_count,omitempty"`
	ReferenceImageURLs  []string `json:"reference_image_urls,omitempty"`
	ReferenceImagesData []string `json:"reference_images,omitempty"`
}

type submitResponse struct {
	ID          string  `json:"id"`
	Object      string  `json:"object"`
	Status      string  `json:"status"`
	Model       string  `json:"model"`
	Size        string  `json:"size"`
	Resolution  string  `json:"resolution"`
	Quality     string  `json:"quality"`
	ImageCount  int     `json:"image_count"`
	CreditsCost float64 `json:"credits_cost"`
	Error       string  `json:"error,omitempty"`
	Message     string  `json:"message,omitempty"`
}

type taskResponse struct {
	ID                string   `json:"id"`
	Status            string   `json:"status"`
	Progress          int      `json:"progress"`
	ImageURL          string   `json:"image_url"`
	ImageURLs         []string `json:"image_urls"`
	ImageURLsAbsolute []string `json:"image_urls_absolute"`
	Prompt            string   `json:"prompt"`
	Model             string   `json:"model"`
	CreditsCost       float64  `json:"credits_cost"`
	FailReason        string   `json:"fail_reason,omitempty"`
	Error             string   `json:"error,omitempty"`
	Message           string   `json:"message,omitempty"`
}

// Extra generation options that have no field on TaskSubmitReq and therefore
// arrive through its metadata map.
type imageOptions struct {
	Resolution string `json:"resolution,omitempty"`
	Quality    string `json:"quality,omitempty"`
	N          int    `json:"n,omitempty"`
	ImageCount int    `json:"image_count,omitempty"`
}
