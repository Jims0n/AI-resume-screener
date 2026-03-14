import json
import logging

import anthropic
from django.conf import settings

from .utils import parse_json_response

info_logger = logging.getLogger('app_info')
error_logger = logging.getLogger('app_error')


def compare_candidates(candidates, job) -> dict:
    """Use Claude API to generate a comparison summary of candidates."""
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key or api_key == 'your-api-key-here':
        info_logger.warning("Anthropic API key not configured. Skipping AI comparison.")
        return {
            'comparison_summary': 'AI comparison unavailable. Please configure the API key.',
            'recommendation': '',
        }

    candidate_summaries = []
    for c in candidates:
        skills_found = [
            sm.skill_name for sm in c.skill_matches.all() if sm.found
        ]
        candidate_summaries.append({
            'id': c.id,
            'name': c.name,
            'overall_score': c.overall_score,
            'skill_match_score': c.skill_match_score,
            'experience_score': c.experience_score,
            'education_score': c.education_score,
            'strengths': c.strengths,
            'red_flags': c.red_flags,
            'skills_found': skills_found,
            'parsed_data': c.parsed_data,
        })

    try:
        client = anthropic.Anthropic(api_key=api_key, timeout=90.0)

        message = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=2048,
            messages=[
                {
                    "role": "user",
                    "content": f"""You are an expert recruiter comparing candidates for a job position.

Compare these candidates and provide a structured analysis.

Return ONLY valid JSON:
{{
  "comparison_summary": "A detailed 3-5 sentence comparison highlighting each candidate's relative strengths and weaknesses",
  "recommendation": "1-2 sentences on who to prioritize and why"
}}

Job:
- Title: {job.title}
- Required Skills: {json.dumps(job.required_skills)}
- Nice-to-Have Skills: {json.dumps(job.nice_to_have_skills)}
- Minimum Experience: {job.min_experience_years} years

Candidates:
{json.dumps(candidate_summaries, indent=2)}"""
                }
            ],
        )

        response_text = message.content[0].text
        result = parse_json_response(response_text)
        candidate_names = [c.name for c in candidates]
        info_logger.info(f"Candidates compared: job='{job.title}' candidates={candidate_names}")
        return result

    except Exception as e:
        error_logger.error(f"Failed to compare candidates for job='{job.title}': {e}", exc_info=True)
        return {
            'comparison_summary': 'AI comparison failed. Please try again later.',
            'recommendation': '',
        }
