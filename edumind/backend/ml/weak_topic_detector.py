import numpy as np
try:
    from sklearn.cluster import KMeans
    SKLEARN_OK = True
except ImportError:
    SKLEARN_OK = False


def detect_weak_topics(topic_scores: dict) -> list:
    if not topic_scores:
        return []
    topics = list(topic_scores.keys())
    scores = [topic_scores[t] for t in topics]

    results = []
    if SKLEARN_OK and len(topics) >= 3:
        arr = np.array(scores).reshape(-1, 1)
        n = min(3, len(topics))
        km = KMeans(n_clusters=n, random_state=42, n_init=10)
        labels = km.fit_predict(arr)
        cluster_means = {i: float(np.mean([scores[j] for j in range(len(topics)) if labels[j] == i]))
                         for i in range(n)}
        sorted_c = sorted(cluster_means, key=cluster_means.get)
        weak_c   = sorted_c[0]
        mid_c    = sorted_c[1] if n > 1 else None
        for i, topic in enumerate(topics):
            s = scores[i]
            c = int(labels[i])
            if s >= 75:
                continue
            severity = "high" if c == weak_c else "medium" if c == mid_c else "low"
            results.append({"topic": topic, "score": round(s, 1), "severity": severity,
                             "cluster_label": f"Cluster {chr(65 + c)}"})
    else:
        for topic, s in topic_scores.items():
            if s < 75:
                results.append({"topic": topic, "score": round(s, 1),
                                 "severity": "high" if s < 55 else "medium",
                                 "cluster_label": "Cluster A" if s < 55 else "Cluster B"})
    return sorted(results, key=lambda x: x["score"])
