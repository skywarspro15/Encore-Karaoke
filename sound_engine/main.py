# Forte Sound Engine for Encore Karaoke
# (c) 2025 Tranch Software

import threading
import time
import socketio
import eventlet
import importlib

# --- Dynamically import pedalboard ---
try:
    pedalboard_module = importlib.import_module("pedalboard")
    from pedalboard.io import AudioStream
except ImportError:
    print("FATAL: The 'pedalboard' library is not installed. Please run: pip install pedalboard")
    exit()

# --- Global state management ---
audio_processor_thread = None
# Store the current configuration to reuse during restarts
current_config = {
    "input_device": None,
    "output_device": None,
    "buffer_size": 1024,  # Default buffer size
}

# --- Socket.IO Server Setup ---
sio = socketio.Server(cors_allowed_origins='*')
app = socketio.WSGIApp(sio)


class AudioProcessor(threading.Thread):
    def __init__(self, input_device, output_device, buffer_size):
        super().__init__()
        self.daemon = True
        self._stop_event = threading.Event()
        self.stream = None
        self.input_device = input_device
        self.output_device = output_device
        self.buffer_size = int(buffer_size)  # Ensure buffer size is an integer
        self.is_running = False

    def run(self):
        print(
            f"AudioProcessor: Starting stream with config: In='{self.input_device}', Out='{self.output_device}', Buffer={self.buffer_size}")
        try:
            with AudioStream(
                input_device_name=self.input_device,
                output_device_name=self.output_device,
                num_input_channels=1,
                num_output_channels=2,
                allow_feedback=True,
                buffer_size=self.buffer_size,
            ) as self.stream:

                self.stream.plugins = pedalboard_module.Pedalboard([])
                self.is_running = True

                while not self._stop_event.is_set():
                    time.sleep(0.1)

        except Exception as e:
            print(f"FATAL ERROR in AudioProcessor thread: {e}")
            self.is_running = False
            sio.emit('error', {'message': f"Audio engine failed: {e}"})
            sio.emit('engine_status', {
                     'running': False, 'config': current_config})

        print("AudioProcessor: Stream has stopped.")
        self.is_running = False

    def stop(self):
        print("AudioProcessor: Stop signal received.")
        self._stop_event.set()


# --- Internal Helper Functions ---

def _start_engine_internal():
    global audio_processor_thread
    if audio_processor_thread and audio_processor_thread.is_alive():
        return  # Already running

    # Use defaults if not set
    if current_config["input_device"] is None:
        current_config["input_device"] = AudioStream.input_device_names[0]
    if current_config["output_device"] is None:
        current_config["output_device"] = AudioStream.output_device_names[0]

    audio_processor_thread = AudioProcessor(
        current_config["input_device"],
        current_config["output_device"],
        current_config["buffer_size"],
    )
    audio_processor_thread.start()
    time.sleep(1)  # Give the stream a moment to initialize
    sio.emit('engine_status', {
             'running': audio_processor_thread.is_running, 'config': current_config})


def _stop_engine_internal():
    global audio_processor_thread
    if audio_processor_thread and audio_processor_thread.is_alive():
        audio_processor_thread.stop()
        audio_processor_thread.join()
        audio_processor_thread = None
    sio.emit('engine_status', {'running': False, 'config': current_config})

# --- Socket.IO Event Handlers ---


@sio.on('connect')
def connect(sid, environ):
    print(f"CLIENT CONNECTED: {sid}")
    # Immediately send the available devices and current status to the new client
    sio.emit('audio_devices', {
        'inputs': AudioStream.input_device_names,
        'outputs': AudioStream.output_device_names,
    }, to=sid)
    is_running = audio_processor_thread is not None and audio_processor_thread.is_running
    sio.emit('engine_status', {'running': is_running,
             'config': current_config}, to=sid)


@sio.on('start_engine')
def start_engine(sid, data):
    print("Received request to start engine.")
    _start_engine_internal()


@sio.on('stop_engine')
def stop_engine(sid, data):
    print("Received request to stop engine.")
    _stop_engine_internal()


@sio.on('change_settings')
def change_settings(sid, data):
    """ Handles changing devices or buffer size, which requires a restart. """
    was_running = audio_processor_thread and audio_processor_thread.is_alive()
    print(f"Received request to change settings: {data}")

    if was_running:
        print("Engine is running, performing graceful restart...")
        _stop_engine_internal()
        time.sleep(0.2)  # Small pause to ensure resources are released

    # Handle data as a string if it's a single device change
    if isinstance(data, str):
        current_config["input_device"] = data
    # Handle data as a dictionary for multiple settings
    elif isinstance(data, dict):
        if "input_device" in data:
            current_config["input_device"] = data["input_device"]
        if "output_device" in data:
            current_config["output_device"] = data["output_device"]
        if "buffer_size" in data:
            current_config["buffer_size"] = data["buffer_size"]

    print(f"New configuration set: {current_config}")

    if was_running:
        print("Restarting engine with new settings...")
        _start_engine_internal()
    else:
        # If the engine wasn't running, just confirm the settings were updated
        sio.emit('engine_status', {'running': False, 'config': current_config})


@sio.on('set_effects')
def set_effects(sid, data):
    if not (audio_processor_thread and audio_processor_thread.is_running):
        return sio.emit('error', {'message': 'Audio engine not running.'})
    # ... (rest of the function is the same as before) ...
    new_board = []
    try:
        for effect_config in data:
            PluginClass = getattr(pedalboard_module, effect_config["plugin"])
            new_board.append(PluginClass(**effect_config.get("params", {})))
        audio_processor_thread.stream.plugins = pedalboard_module.Pedalboard(
            new_board)
        sio.emit('success', {'message': 'Effects chain updated.'})
    except Exception as e:
        sio.emit('error', {'message': f'Failed to set effects: {e}'})


@sio.on('update_effect')
def update_effect(sid, data):
    if not (audio_processor_thread and audio_processor_thread.is_running):
        return sio.emit('error', {'message': 'Audio engine not running.'})
    try:
        plugin = audio_processor_thread.stream.plugins[data['index']]
        for key, value in data['params'].items():
            setattr(plugin, key, value)
        sio.emit(
            'success', {'message': f'Updated plugin at index {data["index"]}.'})
    except Exception as e:
        sio.emit('error', {'message': f'Failed to update effect: {e}'})


@sio.on('disconnect')
def disconnect(sid):
    print(f"CLIENT DISCONNECTED: {sid}")


if __name__ == "__main__":
    print("--- Forte Sound Engine v1.1 ---")
    print("Starting Socket.IO server on http://localhost:8765")
    eventlet.wsgi.server(eventlet.listen(('localhost', 8765)), app)
