from collections import Counter
import math

from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize


MAX_SUMMARY_SENTENCES = 3
SUMMARY_FRACTION = 0.3


def summarize_extractive(text: str) -> str:

    sentences = sent_tokenize(text.strip())
    if not sentences:
        return ""
    if len(sentences) == 1:
        return sentences[0]

    ignored = set(stopwords.words("english"))
    # Keep alphabetic words only; case-fold so "Python" and "python" match.
    words = [
        word.lower()
        for word in word_tokenize(text)
        if word.isalpha() and word.lower() not in ignored
    ]
    frequencies = Counter(words)

    # When the input contains only stopwords/punctuation, return first sentence.
    if not frequencies:
        return sentences[0]

    highest = max(frequencies.values())
    normalized = {word: count / highest for word, count in frequencies.items()}

    scores = []
    for index, sentence in enumerate(sentences):
        content_words = [
            word.lower()
            for word in word_tokenize(sentence)
            if word.isalpha() and word.lower() not in ignored
        ]
        # The mean reduces the advantage of very long sentences.
        score = (
            sum(normalized.get(word, 0.0) for word in content_words)
            / len(content_words)
            if content_words
            else 0.0
        )
        scores.append((index, score))

    count = min(
        MAX_SUMMARY_SENTENCES,
        max(1, math.ceil(len(sentences) * SUMMARY_FRACTION)),
    )
    # Stable tie breaking ensures a deterministic summary.
    selected = sorted(scores, key=lambda item: (-item[1], item[0]))[:count]
    indices = sorted(index for index, _ in selected)
    return " ".join(sentences[index] for index in indices)
