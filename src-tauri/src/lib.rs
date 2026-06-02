use std::fs;
use std::path::PathBuf;

/// Copy a media file from source to the app's media directory.
/// Returns the destination path so the frontend can serve it via convertFileSrc.
#[tauri::command]
fn copy_media_file(source: String, media_dir: String) -> Result<String, String> {
    // Ensure the media directory exists
    fs::create_dir_all(&media_dir).map_err(|e| format!("Failed to create media dir: {}", e))?;

    let src = PathBuf::from(&source);
    let file_name = src
        .file_name()
        .ok_or_else(|| "Invalid source file path".to_string())?;

    // Use timestamp prefix to avoid name collisions
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let dest = PathBuf::from(&media_dir).join(format!(
        "{}-{}",
        now,
        file_name.to_string_lossy()
    ));

    fs::copy(&src, &dest).map_err(|e| format!("Failed to copy file: {}", e))?;

    Ok(dest.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::init())
        .invoke_handler(tauri::generate_handler![copy_media_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
