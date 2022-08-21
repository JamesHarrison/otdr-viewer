#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use otdrs::parser::parse_file;
use otdrs::types::SORFile;
use serde::Serialize;
use std::collections::HashMap;
use std::fs::File;
use std::io::prelude::*;
use std::sync::Mutex;
use rayon::prelude::*;
struct AppState {
    files: Mutex<HashMap<String, SORFile>>,
    summaries: Mutex<HashMap<String, OtdrDataSummary>>,
}

#[derive(Debug, Serialize, Clone)]
struct OtdrDataSummary {
    graph: Vec<(f64, f64)>,
}

#[tauri::command]
fn open_sorfile<'a>(state: tauri::State<AppState>, path: String) -> Result<String, &'a str> {
    println!("Opening '{}'", path);
    let mut in_file = match File::open(path.clone()) {
        Err(_e) => return Err("Failed to open provided file"),
        Ok(f) => f,
    };
    let mut in_data: Vec<u8> = Vec::new();
    match in_file.read_to_end(&mut in_data) {
        Err(_e) => return Err("Unable to read file data"),
        Ok(r) => r,
    };
    let sor = match parse_file(in_data.as_slice()) {
        Err(_e) => return Err("Unable to parse OTDR file"),
        Ok(s) => s.1,
    };
    state
        .files
        .lock()
        .unwrap()
        .insert(path.clone(), sor.clone());
    let summary = match generate_sorfile_summary(&sor) {
        Err(_e) => return Err("Unable to load OTDR file data"),
        Ok(s) => s,
    };
    state
        .summaries
        .lock()
        .unwrap()
        .insert(path.clone(), summary);
    Ok(path)
}

#[tauri::command]
fn get_sorfile<'a>(state: tauri::State<AppState>, path: String) -> Result<SORFile, &'a str> {
    match state.files.lock().unwrap().get(&path) {
        None => return Err("Unable to retrieve SOR data for path"),
        Some(s) => return Ok(s.to_owned()),
    }
}

#[tauri::command]
fn get_summary<'a>(
    state: tauri::State<AppState>,
    path: String,
) -> Result<OtdrDataSummary, &'a str> {
    match state.summaries.lock().unwrap().get(&path) {
        None => return Err("Unable to retrieve summary data for path"),
        Some(s) => return Ok(s.to_owned()),
    }
}

fn generate_sorfile_summary<'a>(sor: &SORFile) -> Result<OtdrDataSummary, &'a str> {
    let data_points = match &sor.data_points {
        None => return Err("Unable to load data points from SOR"),
        Some(s) => s,
    };
    if data_points.total_number_scale_factors_used != 1 {
        return Err("Number of scale factors in this SOR is not 1 - not supported");
    }
    let fixed_parameters = match &sor.fixed_parameters {
        None => return Err("Unable to load fixed parameters from SOR"),
        Some(f) => f,
    };
    let scale_factor: f64 = data_points.scale_factors[0].scale_factor as f64;
    let speed_of_light: f64 = 299792458.0;
    let ior: f64 = fixed_parameters.group_index as f64 / 100000.0;
    let mut x_pts: Vec<f64> = Vec::with_capacity(data_points.scale_factors[0].data.len());
    let mut y_pts: Vec<f64> = Vec::with_capacity(data_points.scale_factors[0].data.len());
    let speed_of_light_in_fibre = speed_of_light / ior;
    let seconds_per_10k_points = fixed_parameters.data_spacing[0] as f64 / 1e10;
    let metres_per_data_spacing = (seconds_per_10k_points / 10000.0) * speed_of_light_in_fibre;
    let mut i = 0;
    for point in &data_points.scale_factors[0].data {
        let x: f64 = i as f64 * metres_per_data_spacing;
        let y: f64 = ((65535 - point) as f64) / scale_factor;
        x_pts.push(x);
        y_pts.push(y);
        i += 1;
    }
    let pts: Vec<(f64, f64)> = x_pts.into_par_iter().zip_eq(y_pts).collect();
    return Ok(OtdrDataSummary { graph: pts });
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            files: Mutex::new(HashMap::new()),
            summaries: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            open_sorfile,
            get_sorfile,
            get_summary
        ])
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
