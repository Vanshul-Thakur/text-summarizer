"""Algorithm tests use deterministic tokenizer fixtures; no NLTK download needed."""

from app.services import extractive


def simple_sentence_tokenizer(text):
    return [part.strip() + "." for part in text.strip().split(".") if part.strip()]


def simple_word_tokenizer(text):
    import re
    return re.findall(r"[A-Za-z]+", text)


def setup_tokenizers(monkeypatch):
    monkeypatch.setattr(extractive, "sent_tokenize", simple_sentence_tokenizer)
    monkeypatch.setattr(extractive, "word_tokenize", simple_word_tokenizer)
    from types import SimpleNamespace
    monkeypatch.setattr(extractive, "stopwords", SimpleNamespace(words=lambda lang: ["is", "the", "for", "a", "and"]))


def test_one_sentence_remains_unchanged(monkeypatch):
    setup_tokenizers(monkeypatch)
    assert extractive.summarize_extractive("Python is useful.") == "Python is useful."


def test_best_sentence_is_selected_and_is_original(monkeypatch):
    setup_tokenizers(monkeypatch)
    text = "Dogs are loyal. Python developers use Python. Python is useful. Sunshine is nice."
    result = extractive.summarize_extractive(text)
    assert "Python" in result
    assert result.endswith(".")
    assert all(sentence in simple_sentence_tokenizer(text) for sentence in simple_sentence_tokenizer(result))


def test_multiple_selected_sentences_keep_source_order(monkeypatch):
    setup_tokenizers(monkeypatch)
    text = ("Alpha alpha wins. Beta beta wins. Gamma loses. Delta loses. "
            "Epsilon loses. Zeta loses. Eta loses. Theta loses.")
    result = extractive.summarize_extractive(text)
    source_sentences = simple_sentence_tokenizer(text)
    positions = [source_sentences.index(s) for s in simple_sentence_tokenizer(result)]
    assert positions == sorted(positions)
    assert 1 <= len(positions) <= 3


def test_only_stopwords_return_first_sentence(monkeypatch):
    setup_tokenizers(monkeypatch)
    assert extractive.summarize_extractive("The and. Is a.") == "The and."
