"""Checks that every faculty demo / technique question retrieves the right knowledge-base section first.
Run: python test_retrieval.py"""
from app import retrieve

EXPECTED = {
    # Faculty demo questions (section J)
    "What are the major techniques used to control soil erosion?": "Major techniques",
    "Explain contour farming.": "Contour farming",
    "Explain terracing.": "Terracing",
    "What is the difference between contour farming and terracing?": "Difference between contour farming and terracing",
    "What methods control wind erosion?": "control wind erosion",
    "What methods control water erosion?": "control water erosion",
    "What are agronomic methods of soil conservation?": "Agronomic methods",
    "What are mechanical methods?": "Mechanical (engineering) methods",
    "How does mulching reduce soil erosion?": "Mulching",
    "What is the role of windbreaks?": "Windbreaks",
    # Technique-based questions (section H)
    "What are the methods of controlling soil erosion?": "Major techniques",
    "What are vegetative methods of soil conservation?": "Vegetative (biological) methods",
    "What is contour bunding?": "Contour bunding",
    "What is graded bunding?": "Graded bunding",
    "What are check dams used for?": "Check dams",
    "What is gully plugging?": "Gully plugging",
    "How do windbreaks control wind erosion?": "Windbreaks",
    "What is strip cropping?": "Strip cropping",
    "What is conservation tillage?": "Conservation tillage",
    # Comparisons (section G)
    "Mulching vs cover crops": "Mulching vs cover crops",
    "Windbreaks vs shelterbelts": "Windbreaks vs shelterbelts",
    "Conservation tillage vs conventional tillage": "Conservation tillage vs conventional tillage",
    "Contour bunding vs graded bunding": "Contour bunding vs graded bunding",
    "Agronomic vs mechanical conservation methods": "Agronomic vs mechanical",
}

fails = []
for q, want in EXPECTED.items():
    hits = retrieve(q)
    got = hits[0][0]["title"] if hits else "<nothing>"
    ok = got.startswith(want) or (want.islower() and want in got)
    print(("OK  " if ok else "FAIL"), q, "->", got)
    if not ok:
        fails.append(q)

assert not retrieve("Who won the cricket world cup?"), "off-topic question should retrieve nothing"
assert not fails, f"{len(fails)} question(s) retrieved the wrong section"
print("All retrieval checks passed.")
