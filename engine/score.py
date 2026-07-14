def calculate_score(hook, scroll_stop, product, editing, cta, engagement, viral):
    score = (
        hook * 0.20 +
        scroll_stop * 0.15 +
        product * 0.20 +
        editing * 0.10 +
        cta * 0.10 +
        engagement * 0.10 +
        viral * 0.15
    )

    return round(score, 2)
