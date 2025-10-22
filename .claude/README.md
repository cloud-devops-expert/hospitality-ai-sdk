# Claude Code Configuration

This directory contains Claude Code configuration for the Hospitality AI SDK project.

## Files

### `CLAUDE.md`

Project-specific instructions and guidelines for Claude Code. This file contains:

- Project philosophy and principles
- Development guidelines
- Code style standards
- Cost optimization rules
- Module responsibilities
- Common tasks and workflows

### `settings.local.json` (local only)

Local configuration file for allowed tools. This file is gitignored and should be created locally.

To set up:

```bash
cp settings.example.json settings.local.json
```

### `settings.example.json`

Template for `settings.local.json`. Contains recommended allowed tools:

- `Bash` - For terminal operations
- `Write` - For creating files
- `WebSearch` - For web searches
- `Edit` - For editing files
- `Read` - For reading files

## Usage

When working on this project with Claude Code, the AI assistant will automatically:

1. Read `CLAUDE.md` for project-specific guidelines
2. Use allowed tools from `settings.local.json`
3. Follow development standards and best practices
4. Maintain cost-effectiveness and sustainability principles

## Customization

You can customize Claude Code behavior by:

1. Editing `CLAUDE.md` to add/modify project guidelines
2. Modifying `settings.local.json` to change allowed tools
3. Adding custom prompts to `.agent/prompts/`

## Important Notes

- `settings.local.json` is gitignored (local configuration only)
- `CLAUDE.md` is version controlled (shared guidelines)
- All team members should use the same `CLAUDE.md`
- Individual developers can customize their `settings.local.json`
