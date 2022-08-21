<script setup lang="ts">
import { onUpdated, ref } from 'vue'
import { useStore } from '../stores/files'
import { DateTime } from 'luxon'
import { LineChart } from 'echarts/charts';

const fileStore = useStore()

function eventCodeToHuman(ec: string) {
  let rets = "";
  if (ec[1] == "E") {
    rets += "End of fibre"
  } else if (ec[1] == "O") {
    rets += "No end of fibre found - out of range"
  } else if (ec[1] == "F") {
    rets += "Found event"
  } else if (ec[1] == "A") {
    rets += "Added event"
  } else if (ec[1] == "M") {
    rets += "Moved event"
  }
  if (ec[0] == "0") {
    rets += " - non-reflective"
  } else if (ec[0] == "1") {
    rets += " - reflective"
  } else if (ec[0] == "2") {
    rets += " - saturated or clipped reflection"
  }
  return rets
}

const chartConfig = ref({});

function drawChart() {
  if (fileStore.currentSummaryData) {
    let event_areas = [] as any[];
    let event_lines = [] as any[];
    if (fileStore.currentData?.key_events != null) {
      fileStore.currentData.key_events.key_events.forEach(element => {
        event_areas.push([
          { xAxis: distCentipsToMeters(fileStore.currentData, element.marker_location_2), name: eventCodeToHuman(element.event_code) },
          { xAxis: distCentipsToMeters(fileStore.currentData, element.marker_location_3) }
        ])
        event_lines.push({xAxis: distCentipsToMeters(fileStore.currentData, element.marker_location_2)})
      });
      event_areas.push([
        { xAxis: distCentipsToMeters(fileStore.currentData, fileStore.currentData.key_events.last_key_event.marker_location_2), name: eventCodeToHuman(fileStore.currentData.key_events.last_key_event.event_code) },
        { xAxis: distCentipsToMeters(fileStore.currentData, fileStore.currentData.key_events.last_key_event.marker_location_3) }
      ])
      event_lines.push({xAxis: distCentipsToMeters(fileStore.currentData, fileStore.currentData.key_events.last_key_event.marker_location_2)})
    }
    chartConfig.value = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      dataZoom: [
        {
          id: 'dataZoomX',
          type: 'slider',
          xAxisIndex: [0],
          filterMode: 'filter'
        },
        {
          id: 'dataZoomY',
          type: 'slider',
          yAxisIndex: [0],
          filterMode: 'empty'
        }
      ],
      xAxis: {
        type: 'value',
        name: 'Distance'
      },
      yAxis: {
        type: 'value',
        name: 'dB'
      },
      series: [
        {
          type: 'line',
          data: fileStore.currentSummaryData['graph'],
          symbol: 'none',
          smooth: false,
          sampling: 'lttb',
          markArea: {
            itemStyle: {
              color: 'rgba(170, 170, 200, 0.2)'
            },
            data: event_areas,
          },
          markLine: {
            symbol: ['none', 'none'],
            label: { show: false },
            data: event_lines
          },
          animation: false
        }
      ],
    }
    console.log(chartConfig.value)
  } else {
    chartConfig.value = {}
  }
}

function distCentipsToMeters(file: any, val: number): number {
  let speed_of_light = 299792458.0
  let ior = file['fixed_parameters']['group_index'] / 100000.0
  let speed_of_light_in_fibre = speed_of_light / ior
  return (val / 1e10) * speed_of_light_in_fibre
}

function lastEventDistance(file: any, event: any) {
  let last_event = file['key_events']['key_events'].filter(
    (e: any) => e['event_number'] == parseInt(event['event_number']) - 1
  )
  if (last_event.length == 1 && 'event_propogation_time' in event && event['event_propogation_time'] > 0 && 'event_propogation_time' in last_event[0] && last_event[0]['event_propogation_time']) {
    return (distCentipsToMeters(file, event['event_propogation_time'])
      - distCentipsToMeters(
        file,
        last_event[0]['event_propogation_time']
      )).toPrecision(6)
  }
  return null
}


let lastFile = ref(null as null | string);
onUpdated(() => {
  if (lastFile.value != fileStore.currentFile) {
    lastFile.value = fileStore.currentFile
    drawChart()
  }
})
fileStore.$subscribe((mutation, state) => {
  if (lastFile.value != fileStore.currentFile) {
    lastFile.value = fileStore.currentFile
    drawChart()
  }
})

</script>

<template>
  <div v-if="fileStore.$state.currentFile != null && fileStore.currentData != null">
    <h2>{{ fileStore.$state.currentFile.replace(/^.*[\\\/]/, '') }}</h2>
    <div v-if="fileStore.currentData.fixed_parameters?.units_of_distance != 'mt'" class="alert alert-danger"
      role="alert">
      This OTDR file does not store data in meters. Analysis and display of distances is likely to be completely wrong.
      OTDR Viewer only supports meters currently.
    </div>
    <div
      v-if="fileStore.currentData.key_events != null && fileStore.currentData.fixed_parameters != null && fileStore.currentData.general_parameters != null && fileStore.currentData.supplier_parameters != null">
      <v-chart class="chart" :option="chartConfig" :autoresize="true" />
      <div class="card-group mb-3">
        <div class="card">
          <div class="card-header">End-to-End Loss</div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item">
              {{ fileStore.currentData.key_events.last_key_event.end_to_end_loss / 1000.0 }} dB
              ({{ distCentipsToMeters(fileStore.currentData,
                  fileStore.currentData.key_events.last_key_event.end_to_end_marker_position_1).toPrecision(6)
              }}-{{ distCentipsToMeters(fileStore.currentData,
    fileStore.currentData.key_events.last_key_event.end_to_end_marker_position_2).toPrecision(6)
}}m)
            </li>
          </ul>
        </div>
        <div class="card">
          <div class="card-header">Optical Return Loss</div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item">
              {{ fileStore.currentData.key_events.last_key_event.optical_return_loss / 1000.0 }} dB
              ({{ distCentipsToMeters(fileStore.currentData,
                  fileStore.currentData.key_events.last_key_event.optical_return_loss_marker_position_1).toPrecision(6)
              }}-{{ distCentipsToMeters(fileStore.currentData,
    fileStore.currentData.key_events.last_key_event.optical_return_loss_marker_position_2).toPrecision(6)
}}m)
            </li>
          </ul>
        </div>
        <div class="card">
          <div class="card-header">Distance</div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item">{{ distCentipsToMeters(fileStore.currentData,
                fileStore.currentData.key_events.last_key_event.event_propogation_time).toPrecision(6)
            }} m</li>
          </ul>
        </div>
      </div>
      <h3>Test Parameters</h3>
      <div class="card-group mb-3">
        <div class="card">
          <div class="card-header">Basic Information</div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item">Test Wavelength:
              {{ fileStore.currentData.fixed_parameters.actual_wavelength / 10 }} nm</li>
            <li class="list-group-item">Pulsewidth:
              {{ fileStore.currentData.fixed_parameters.pulse_widths_used[0] }} ns</li>
            <li class="list-group-item">Range:
              {{
                  distCentipsToMeters(fileStore.currentData,
                    fileStore.currentData.fixed_parameters.acquisition_range).toPrecision(6)
              }} m</li>
            <li class="list-group-item">Averaging Time: {{ fileStore.currentData.fixed_parameters.averaging_time }}
              s
            </li>
            <li class="list-group-item">Timestamp:
              {{
                  DateTime.fromSeconds(fileStore.currentData.fixed_parameters.date_time_stamp).toLocal().toLocaleString(DateTime.DATETIME_FULL)
              }}
            </li>
          </ul>
        </div>
        <div class="card">
          <div class="card-header">Context</div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item">Operator: {{ fileStore.currentData.general_parameters.operator }}</li>
            <li class="list-group-item">Fiber ID: {{ fileStore.currentData.general_parameters.fiber_id }}</li>
            <li class="list-group-item">Cable ID: {{ fileStore.currentData.general_parameters.cable_id }}</li>
            <li class="list-group-item">Originating:
              {{ fileStore.currentData.general_parameters.originating_location }}</li>
            <li class="list-group-item">Terminating:
              {{ fileStore.currentData.general_parameters.terminating_location }}</li>
          </ul>
        </div>
        <div class="card">
          <div class="card-header">Test Equipment</div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item">Optical Module:
              {{ fileStore.currentData.supplier_parameters.optical_module_id }}</li>
            <li class="list-group-item">Serial Number:
              {{ fileStore.currentData.supplier_parameters.optical_module_sn }}</li>
            <li class="list-group-item">Mainframe: {{ fileStore.currentData.supplier_parameters.otdr_mainframe_id }}
            </li>
            <li class="list-group-item">Serial Number:
              {{ fileStore.currentData.supplier_parameters.otdr_mainframe_sn }}</li>
            <li class="list-group-item">Supplier: {{ fileStore.currentData.supplier_parameters.supplier_name }}</li>
          </ul>
        </div>

      </div>

      <h3>Link Events</h3>
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Distance/Length (m)</th>
            <th scope="col">Type</th>
            <th scope="col">Reflectance (dB)</th>
            <th scope="col">Loss (dB)</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="event in fileStore.currentData['key_events']['key_events']" :key="event['event_number']">
            <tr v-if="lastEventDistance(fileStore.currentData, event)">
              <td>{{ lastEventDistance(fileStore.currentData, event) }}</td>
              <td colspan="3">Section - {{ event['attenuation_coefficient_lead_in_fiber'] / 1000.0 }}dB/km attenuation
              </td>
            </tr>
            <tr>
              <td>{{ distCentipsToMeters(fileStore.currentData, event['event_propogation_time']).toPrecision(6) }}</td>
              <td>{{ eventCodeToHuman(event['event_code']) }}</td>
              <td>{{ event['event_reflectance'] / 1000.0 }}</td>
              <td>{{ event['event_loss'] / 1000.0 }}</td>
            </tr>
          </template>
          <tr>
            <td>{{ distCentipsToMeters(fileStore.currentData,
                fileStore.currentData.key_events.last_key_event.event_propogation_time).toPrecision(6)
            }}</td>
            <td>{{ eventCodeToHuman(fileStore.currentData.key_events.last_key_event.event_code) }}</td>
            <td>{{ fileStore.currentData.key_events.last_key_event.event_reflectance / 1000.0 }}</td>
            <td>{{ fileStore.currentData.key_events.last_key_event.event_loss / 1000.0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <div class="alert alert-danger" role="alert">
        <h2>File does not contain all required blocks</h2>
        <p>The current file you are trying to open doesn't have all the OTDR blocks required by the application.</p>
        <ul>
          <li v-if="fileStore.currentData.link_parameters == null">Missing link parameters</li>
          <li v-if="fileStore.currentData.key_events == null">Missing key events</li>
          <li v-if="fileStore.currentData.general_parameters == null">Missing general parameters events</li>
          <li v-if="fileStore.currentData.fixed_parameters == null">Missing fixed parameters block</li>
          <li v-if="fileStore.currentData.supplier_parameters == null">Missing supplier parameters block</li>
        </ul>

      </div>
    </div>
  </div>
  <div v-else>
    <h2>No file selected</h2>
    <p>Open or select a file to get started</p>
  </div>


</template>

<style scoped>
.chart {
  height: 600px;
}
</style>
