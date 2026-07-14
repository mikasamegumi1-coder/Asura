def analyze_hook(score):
    if score >= 90:
        return "Hook Sangat Kuat"
    elif score >= 80:
        return "Hook Kuat"
    elif score >= 70:
        return "Hook Cukup"
    elif score >= 60:
        return "Hook Lemah"
    else:
        return "Hook Sangat Lemah"
