import json
import re
import logging

error_logger = logging.getLogger('app_error')


def parse_json_response(response_text: str) -> dict:
    """Extract and parse JSON from an AI model response."""
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            return json.loads(json_match.group())
        error_logger.error(f"No valid JSON found in AI response: {response_text[:200]}")
        raise ValueError("No valid JSON found in AI response")
