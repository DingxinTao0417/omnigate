package adforge

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/relay/channel"
	"github.com/QuantumNous/new-api/relay/channel/task/taskcommon"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
)

// maxImageCount bounds the per-request image count before it is used as a
// billing multiplier. The most permissive adforge model allows 15.
const maxImageCount = 15

const (
	submitPath     = "/api/v1/images/generations"
	fetchPath      = "/api/v1/tasks"
	defaultBaseURL = "https://adforge.cn"
)

type TaskAdaptor struct {
	ChannelType int
	apiKey      string
	baseURL     string
}

func (a *TaskAdaptor) Init(info *relaycommon.RelayInfo) {
	a.ChannelType = info.ChannelType
	a.baseURL = info.ChannelBaseUrl
	a.apiKey = info.ApiKey
}

func (a *TaskAdaptor) ValidateRequestAndSetAction(c *gin.Context, info *relaycommon.RelayInfo) *dto.TaskError {
	if taskErr := relaycommon.ValidateBasicTaskRequest(c, info, constant.TaskActionGenerate); taskErr != nil {
		return taskErr
	}

	// Reject an out-of-range count here rather than clamping silently: the
	// caller is billed per image, so a request asking for more than the
	// upstream allows should fail visibly instead of charging for fewer.
	req, err := getTaskRequest(c)
	if err != nil {
		return service.TaskErrorWrapperLocal(err, "invalid_request", http.StatusBadRequest)
	}
	count, err := resolveImageCount(&req)
	if err != nil {
		return service.TaskErrorWrapperLocal(err, "invalid_image_count", http.StatusBadRequest)
	}
	c.Set(imageCountKey, count)
	return nil
}

// EstimateBilling charges per image: the base model price covers one image and
// the count becomes a multiplier.
func (a *TaskAdaptor) EstimateBilling(c *gin.Context, _ *relaycommon.RelayInfo) map[string]float64 {
	count := c.GetInt(imageCountKey)
	if count <= 1 {
		return nil
	}
	return map[string]float64{"image_count": float64(count)}
}

func (a *TaskAdaptor) AdjustBillingOnSubmit(_ *relaycommon.RelayInfo, _ []byte) map[string]float64 {
	return nil
}

// AdjustBillingOnComplete keeps the amount charged at submit time. Adforge
// reports credits_cost in its own currency, which has no fixed relationship to
// this deployment's pricing, so it cannot drive settlement.
func (a *TaskAdaptor) AdjustBillingOnComplete(_ *model.Task, _ *relaycommon.TaskInfo) int {
	return 0
}

func (a *TaskAdaptor) BuildRequestURL(info *relaycommon.RelayInfo) (string, error) {
	return strings.TrimSuffix(a.baseURL, "/") + submitPath, nil
}

func (a *TaskAdaptor) BuildRequestHeader(c *gin.Context, req *http.Request, info *relaycommon.RelayInfo) error {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+a.apiKey)
	return nil
}

func (a *TaskAdaptor) BuildRequestBody(c *gin.Context, info *relaycommon.RelayInfo) (io.Reader, error) {
	req, err := getTaskRequest(c)
	if err != nil {
		return nil, err
	}

	count := c.GetInt(imageCountKey)
	if count <= 0 {
		count = 1
	}

	var opts imageOptions
	if err := taskcommon.UnmarshalMetadata(req.Metadata, &opts); err != nil {
		return nil, err
	}

	payload := submitRequest{
		Prompt:     req.Prompt,
		Model:      info.UpstreamModelName,
		Size:       normalizeAspectRatio(req.Size),
		Resolution: opts.Resolution,
		Quality:    opts.Quality,
		ImageCount: count,
	}

	// Reference images arrive either as URLs or as base64 data URLs; adforge
	// takes them on separate fields.
	for _, image := range req.Images {
		if strings.HasPrefix(image, "data:") {
			payload.ReferenceImagesData = append(payload.ReferenceImagesData, image)
			continue
		}
		payload.ReferenceImageURLs = append(payload.ReferenceImageURLs, image)
	}

	data, err := common.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return bytes.NewReader(data), nil
}

func (a *TaskAdaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (*http.Response, error) {
	return channel.DoTaskApiRequest(a, c, info, requestBody)
}

func (a *TaskAdaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (string, []byte, *dto.TaskError) {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", nil, service.TaskErrorWrapper(err, "read_response_body_failed", http.StatusInternalServerError)
	}

	var submitted submitResponse
	if err := common.Unmarshal(responseBody, &submitted); err != nil {
		return "", nil, service.TaskErrorWrapper(err, "unmarshal_response_failed", http.StatusInternalServerError)
	}

	if resp.StatusCode != http.StatusOK || submitted.ID == "" {
		message := firstNonEmpty(submitted.Error, submitted.Message, string(responseBody))
		return "", nil, service.TaskErrorWrapperLocal(
			fmt.Errorf("%s", message), "submit_task_failed", resp.StatusCode)
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         info.PublicTaskID,
		"task_id":    info.PublicTaskID,
		"object":     "image.generation",
		"status":     model.TaskStatusSubmitted,
		"model":      info.OriginModelName,
		"created_at": time.Now().Unix(),
	})
	return submitted.ID, responseBody, nil
}

func (a *TaskAdaptor) FetchTask(baseUrl, key string, body map[string]any, _ string) (*http.Response, error) {
	taskID, ok := body["task_id"].(string)
	if !ok || taskID == "" {
		return nil, fmt.Errorf("invalid task_id")
	}

	url := fmt.Sprintf("%s%s/%s", strings.TrimSuffix(baseUrl, "/"), fetchPath, taskID)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+key)

	return service.GetHttpClient().Do(req)
}

func (a *TaskAdaptor) ParseTaskResult(respBody []byte) (*relaycommon.TaskInfo, error) {
	var parsed taskResponse
	if err := common.Unmarshal(respBody, &parsed); err != nil {
		return nil, fmt.Errorf("failed to unmarshal task response: %w", err)
	}

	taskInfo := &relaycommon.TaskInfo{
		TaskID: parsed.ID,
		Reason: firstNonEmpty(parsed.FailReason, parsed.Error, parsed.Message),
	}

	switch strings.ToUpper(parsed.Status) {
	case "PENDING", "SUBMITTED":
		taskInfo.Status = model.TaskStatusSubmitted
	case "QUEUED":
		taskInfo.Status = model.TaskStatusQueued
	case "PROCESSING", "RUNNING", "IN_PROGRESS":
		taskInfo.Status = model.TaskStatusInProgress
	case "COMPLETED", "SUCCESS", "SUCCEEDED":
		taskInfo.Status = model.TaskStatusSuccess
		taskInfo.Url = pickResultURL(&parsed, a.baseURL)
		if taskInfo.Url == "" {
			// Upstream says done but gave nothing usable; failing here lets the
			// task be refunded instead of leaving a paid task with no output.
			taskInfo.Status = model.TaskStatusFailure
			taskInfo.Reason = "upstream reported completion without an image url"
		}
	case "FAILED", "FAILURE", "ERROR", "CANCELED", "CANCELLED":
		taskInfo.Status = model.TaskStatusFailure
	default:
		return nil, fmt.Errorf("unknown task status: %s", parsed.Status)
	}
	return taskInfo, nil
}

func (a *TaskAdaptor) GetModelList() []string {
	return ModelList
}

func (a *TaskAdaptor) GetChannelName() string {
	return "adforge"
}
