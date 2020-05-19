package notifiers

import (
	"bytes"
	"strconv"
	"time"

	"bufio"
	"fmt"
	"github.com/grafana/grafana/pkg/infra/log"
	m "github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/alerting"
	"net/http"
	"os"
	"sort"
	"strings"
)

// Global scope so setup once (in DataHubInitKeymap), restart if keys changed...
var keymap = make(map[string]string)
var crc32Table = make([]uint32, 0)

func init() {
	var hosts bytes.Buffer

	DataHubInitKeymap()

	keys := make([]string, 0, len(keymap))
	for key := range keymap {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	for _, hostport := range keys {
		host := strings.Join(strings.Split(hostport, ":")[0:1], "")
		hosts.WriteString(host + ": '" + host + "',\n")
	}

	alerting.RegisterNotifier(&alerting.NotifierPlugin{
		Type:        "datahub",
		Name:        "DataHub",
		Description: "Sends notifications to DataHub",
		Factory:     NewDatahubNotifier,
		OptionsTemplate: `
      <h3 class="page-heading">DataHub settings</h3>
      <div class="gf-form">
        <span class="gf-form-label width-14">Tag Name</span>
        <input type="text" required class="gf-form-input max-width-22" ng-model="ctrl.model.settings.tag" placeholder="Datahub Tag To Update"></input>
      </div>
      <div class="gf-form">
        <span class="gf-form-label width-14">DataHub Server</span>
        <select class="gf-form-input max-width-14" ng-model="ctrl.model.settings.server" ng-options="v as k for (k, v) in {
          ` + hosts.String() + `
        }" ng-init="ctrl.model.settings.server=ctrl.model.settings.server||'scbosco1'"></select>
      </div>
      <div class="gf-form">
        <span class="gf-form-label width-14">Port Number To Send To</span>
        <input type="text" required class="gf-form-input max-width-14" ng-model="ctrl.model.settings.port" placeholder="Datahub Server Port To Send To (9080)"></input>
      </div>
      <div class="gf-form">
        <span class="gf-form-label width-14">Value To Send When In Alert</span>
        <input type="text" required class="gf-form-input max-width-14" ng-model="ctrl.model.settings.alertvalue" placeholder="Datahub Server To Send To"></input>
      </div>
      <div class="gf-form">
        <span class="gf-form-label width-14">Value To Send When Ok</span>
        <input type="text" required class="gf-form-input max-width-14" ng-model="ctrl.model.settings.okvalue" placeholder="Datahub Server To Send To"></input>
      </div>
    `,
	})
}

func NewDatahubNotifier(model *m.AlertNotification) (alerting.Notifier, error) {
	tag := model.Settings.Get("tag").MustString()
	if tag == "" {
		return nil, alerting.ValidationError{Reason: "Could not find tag name property in settings"}
	}
	server := model.Settings.Get("server").MustString()
	port := model.Settings.Get("port").MustString()
	alertvalue := model.Settings.Get("alertvalue").MustString()
	okvalue := model.Settings.Get("okvalue").MustString()

	return &DatahubNotifier{
		NotifierBase: NewNotifierBase(model),
		Tag:          tag,
		Server:       server,
		Port:         port,
		AlertValue:   alertvalue,
		OkValue:      okvalue,
		log:          log.New("alerting.notifier.datahub"),
	}, nil
}

type DatahubNotifier struct {
	NotifierBase
	Tag        string
	Server     string
	Port       string
	AlertValue string
	OkValue    string
	log        log.Logger
}

func (this *DatahubNotifier) Notify(evalContext *alerting.EvalContext) error {

	this.log.Info("Trigger to Datahub", "state", evalContext.Rule.State, "tag", this.Tag, "server", this.Server, "port", this.Port, "AlertValue", this.AlertValue, "OkValue", this.OkValue)

	eventType := "trigger"
	value := this.AlertValue
	if evalContext.Rule.State == m.AlertStateOK {
		eventType = "resolve"
		value = this.OkValue
	}

	now := strconv.FormatInt(time.Now().Unix(), 10)
	key := DataHubKey(this.Server, this.Port)
	address := "http://" + this.Server + ".pc.scunthorpe.corusgroup.com:" + this.Port + "/write"

	tagcrc := fmt.Sprintf("%X", DataHubCRC32(this.Tag+now+value+key))
	tag := "tag=" + this.Tag + " " + now + " " + value + " " + tagcrc

	this.log.Info("Notifying Datahub", "event_type", eventType, "send", tag)

	req, err := http.NewRequest("POST", address, bytes.NewBufferString(tag))
	req.Header.Set("Content-Type", "application/x-www-form-url")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		this.log.Info("Failed to send alert to Datahub", "event_type", eventType, "send", tag, "erro2", err)
	}
	defer resp.Body.Close()

	//Not checking state after sending yet... Code for print below
	//fmt.Println("response Status:", resp.Status)
	//fmt.Println("response Headers:", resp.Header)
	//body, _ := ioutil.ReadAll(resp.Body)
	//fmt.Println("response Body:", string(body))

	return nil
}

func DataHubKey(server string, port string) (key string) {
	key = keymap[strings.ToLower(server)+":"+port]
	return key
}

func DataHubCRC32(data string) (crc32Return uint32) {
	const crc32Init uint32 = 0xFFFFFFFF
	const crc32Xor uint32 = 0xFFFFFFFF
	var crc uint32 = crc32Init

	for ii := 0; ii < len(data); ii++ {
		crc = crc32Table[((crc>>24)^uint32(data[ii]))&0xFF] ^ (crc << 8)
	}

	crc32Return = crc ^ crc32Xor
	return crc32Return

}

func DataHubInitKeymap() {
	file, err := os.Open("conf/localDefaults.ini")
	if err != nil {
		return
	}
	scanner := bufio.NewScanner(file)
	scanner.Split(bufio.ScanLines)

	mode := "none"
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if len(line) == 0 {
			continue
		}

		if strings.HasPrefix(line, "[") && strings.HasSuffix(line, "]") {
			linelen := len(line)
			mode = strings.ToLower(line[1 : linelen-1])
		} else {
			switch mode {
			case "datahub-keys":
				s := strings.Split(line, "=")
				hostport := strings.TrimSpace(strings.Join(s[0:1], ""))
				key := strings.TrimSpace(strings.Join(s[1:2], ""))
				if hostport != "" && key != "" {
					keymap[hostport] = key
				}
			case "datahub-crctable":
				for _, hexvalue := range strings.Split(line, " ") {
					value, err := strconv.ParseUint(hexvalue, 16, 32)
					if err == nil {
						crc32Table = append(crc32Table, uint32(value))
					}
				}
			default:
			}
		}
	}
	file.Close()
}
