import { defineStore, mapGetters } from 'pinia'

interface Summary {
  graph: Number[][],
}
interface GeneralParameters {
  language_code: string,
  cable_id: string,
  fiber_id: string,
  fiber_type: number,
  nominal_wavelength: number,
  originating_location: string,
  terminating_location: string,
  cable_code: string,
  current_data_flag: string,
  user_offset: number,
  user_offset_distance: number,
  operator: string,
  comment: string,
}
interface SupplierParameters {
  supplier_name: string,
  otdr_mainframe_id: string,
  otdr_mainframe_sn: string,
  optical_module_id: string,
  optical_module_sn: string,
  software_revision: string,
  other: string,
}
interface FixedParameters {
  date_time_stamp: number,
  units_of_distance: string,
  actual_wavelength: number,
  acquisition_offset: number,
  acquisition_offset_distance: number,
  total_n_pulse_widths_used: number,
  pulse_widths_used: number[],
  data_spacing: number[],
  n_data_points_for_pulse_widths_used: number[],
  group_index: number,
  backscatter_coefficient: number,
  number_of_averages: number,
  averaging_time: number,
  acquisition_range: number,
  acquisition_range_distance: number,
  front_panel_offset: number,
  noise_floor_level: number,
  noise_floor_scale_factor: number,
  power_offset_first_point: number,
  loss_threshold: number,
  reflectance_threshold: number,
  end_of_fibre_threshold: number,
  trace_type: string,
  window_coordinate_1: number,
  window_coordinate_2: number,
  window_coordinate_3: number,
  window_coordinate_4: number,
}
interface KeyEvent {
  event_number: number,
  event_propogation_time: number,
  attenuation_coefficient_lead_in_fiber: number,
  event_loss: number,
  event_reflectance: number,
  event_code: string,
  loss_measurement_technique: string,
  marker_location_1: number,
  marker_location_2: number,
  marker_location_3: number,
  marker_location_4: number,
  marker_location_5: number,
  comment: string,
}
interface LastKeyEvent {
  event_number: number,
  event_propogation_time: number,
  attenuation_coefficient_lead_in_fiber: number,
  event_loss: number,
  event_reflectance: number,
  event_code: string,
  loss_measurement_technique: string,
  marker_location_1: number,
  marker_location_2: number,
  marker_location_3: number,
  marker_location_4: number,
  marker_location_5: number,
  comment: string,
  end_to_end_loss: number,
  end_to_end_marker_position_1: number,
  end_to_end_marker_position_2: number,
  optical_return_loss: number,
  optical_return_loss_marker_position_1: number,
  optical_return_loss_marker_position_2: number,
}
interface KeyEvents {
  number_of_key_events: number,
  key_events: KeyEvent[],
  last_key_event: LastKeyEvent,
}
interface SORFile {
  map: object,
  general_parameters: null | GeneralParameters,
  supplier_parameters: null | SupplierParameters,
  fixed_parameters: null | FixedParameters,
  key_events: null | KeyEvents,
  link_parameters: null | object,
  data_points: null | object,
  proprietary_blocks: object
}

import { invoke } from '@tauri-apps/api/tauri';

export const useStore = defineStore('files', {
  state: () => {
    return {
      // all these properties will have their type inferred automatically
      openFiles: new Set<String>(),
      files: new Map<string, SORFile>(),
      currentFile: null as null | string,
      summaryData: new Map<string, Summary>(),
    }
  },
  actions: {
    setCurrentFile(filename: string) {
      this.currentFile = filename
    },
    openFile(filename: string) {
      invoke('open_sorfile', { path: filename })
        .then((message) => this.$patch((state) => {
          state.openFiles.add(filename)
        }))
        .catch((error) => console.error(error))
      invoke('get_sorfile', { path: filename })
        .then((message) => this.$patch((state) => {
          state.files.set(filename, message as SORFile)
        }))
        .catch((error) => console.error(error))
      invoke('get_summary', { path: filename })
        .then((message) => this.$patch((state) => {
          state.summaryData.set(filename, message as Summary)
        }))
        .catch((error) => console.error(error))
    }
  },
  getters: {
    currentData(state) {
      if (state.currentFile) {
        return state.files.get(state.currentFile)
      }
      return null
    },
    currentSummaryData(state) {
      if (state.currentFile) {
        return state.summaryData.get(state.currentFile)
      }
      return null
    }
  }
})
