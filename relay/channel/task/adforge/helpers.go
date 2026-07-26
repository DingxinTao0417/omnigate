package adforge

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/relay/channel/task/taskcommon"
	relaycommon "github.com/QuantumNous/new-api/relay/common"

	"github.com/gin-gonic/gin"
)

// imageCountKey carries the validated count from validation to billing and
// body building, so the number billed is always the number requested upstream.
const imageCountKey = "adforge_image_count"

// ModelList is what this channel advertises. Only the two GPT image models are
// enabled; the rest of the adforge catalogue can be added once verified.
var ModelList = []string{
	"gpt-image-2",
	"gpt-image-2-official",
}

func getTaskRequest(c *gin.Context) (relaycommon.TaskSubmitReq, error) {
	v, exists := c.Get("task_request")
	if !exists {
		return relaycommon.TaskSubmitReq{}, fmt.Errorf("request not found in context")
	}
	req, ok := v.(relaycommon.TaskSubmitReq)
	if !ok {
		return relaycommon.TaskSubmitReq{}, fmt.Errorf("unexpected request type in context")
	}
	return req, nil
}

// resolveImageCount reads the count from metadata ("n" or "image_count") and
// rejects anything outside 1..maxImageCount, because the value multiplies the
// charge.
func resolveImageCount(req *relaycommon.TaskSubmitReq) (int, error) {
	var opts imageOptions
	if err := taskcommon.UnmarshalMetadata(req.Metadata, &opts); err != nil {
		return 0, err
	}

	count := opts.ImageCount
	if count == 0 {
		count = opts.N
	}
	if count == 0 {
		return 1, nil
	}
	if count < 1 || count > maxImageCount {
		return 0, fmt.Errorf("image count must be between 1 and %d", maxImageCount)
	}
	return count, nil
}

// normalizeAspectRatio accepts either an aspect ratio ("16:9") or an OpenAI
// style pixel size ("1024x1536") and returns the ratio adforge expects.
func normalizeAspectRatio(size string) string {
	size = strings.TrimSpace(size)
	if size == "" || size == "auto" {
		return ""
	}
	if strings.Contains(size, ":") {
		return size
	}

	width, height, ok := parsePixelSize(size)
	if !ok {
		return size
	}
	switch {
	case width == height:
		return "1:1"
	case width*9 == height*16:
		return "16:9"
	case width*16 == height*9:
		return "9:16"
	case width*2 == height*3:
		return "2:3"
	case width*3 == height*2:
		return "3:2"
	case width*3 == height*4:
		return "3:4"
	case width*4 == height*3:
		return "4:3"
	case width > height:
		return "16:9"
	default:
		return "9:16"
	}
}

func parsePixelSize(size string) (int, int, bool) {
	parts := strings.SplitN(strings.ToLower(size), "x", 2)
	if len(parts) != 2 {
		return 0, 0, false
	}
	var width, height int
	if _, err := fmt.Sscanf(parts[0], "%d", &width); err != nil || width <= 0 {
		return 0, 0, false
	}
	if _, err := fmt.Sscanf(parts[1], "%d", &height); err != nil || height <= 0 {
		return 0, 0, false
	}
	return width, height, true
}

// pickResultURL prefers the absolute URL adforge supplies. Relative paths are
// resolved against host, which is the configured channel base URL when known
// and the published default otherwise, since polling can run on a code path
// that does not carry channel state.
func pickResultURL(parsed *taskResponse, host string) string {
	if len(parsed.ImageURLsAbsolute) > 0 && parsed.ImageURLsAbsolute[0] != "" {
		return parsed.ImageURLsAbsolute[0]
	}
	if len(parsed.ImageURLs) > 0 && parsed.ImageURLs[0] != "" {
		return absoluteURL(parsed.ImageURLs[0], host)
	}
	return absoluteURL(parsed.ImageURL, host)
}

func absoluteURL(raw, host string) string {
	if raw == "" || strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	if host == "" {
		host = defaultBaseURL
	}
	return strings.TrimSuffix(host, "/") + ensureLeadingSlash(raw)
}

func ensureLeadingSlash(path string) string {
	if strings.HasPrefix(path, "/") {
		return path
	}
	return "/" + path
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
