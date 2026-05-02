import os


def get_version():
    config_path = os.path.join(os.path.dirname(__file__), "../config.yaml")
    try:
        with open(config_path, "r") as f:
            for line in f:
                if line.strip().startswith("version:"):
                    return line.split(":")[1].strip().strip('"').strip("'")
    except Exception:
        pass
    return "0.0.0"
