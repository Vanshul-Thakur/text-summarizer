"""Download the tokenizer and stopword data required for extractive mode."""

import nltk


def main() -> None:
    for resource in ("punkt", "punkt_tab", "stopwords"):
        print(f"Checking NLTK resource: {resource}")
        if not nltk.download(resource, quiet=False):
            raise RuntimeError(f"Could not download {resource}; check connectivity")
    print("All required NLTK resources are available.")


if __name__ == "__main__":
    main()
