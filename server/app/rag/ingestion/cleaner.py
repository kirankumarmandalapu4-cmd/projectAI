import re

class TextCleaner:
    @staticmethod
    def clean_text(text: str) -> str:
        """
        Clean and normalize extracted document text.
        Remove multiple spaces, trailing whitespace, and normalize line breaks.
        """
        if not text:
            return ""
        
        # Replace non-breaking spaces
        cleaned = text.replace('\xa0', ' ')
        # Normalize multiple vertical newlines
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        # Remove trailing/leading whitespaces on each line
        lines = [line.strip() for line in cleaned.split('\n')]
        cleaned = '\n'.join(lines)
        # Normalize multiple horizontal spaces
        cleaned = re.sub(r'[ \t]+', ' ', cleaned)
        return cleaned.strip()
