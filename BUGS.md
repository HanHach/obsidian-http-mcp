# Known Bugs - Obsidian HTTP MCP Server

**Status**: 4 critical bugs discovered during v1.0.6 vault reorganization
**Severity**: High (blocking file operations)
**Target Fix**: v1.2

---

## Bug #1: Curly Quote Unicode Apostrophes Break File Operations

**Severity**: 🔴 High - Blocks move_file, delete_file operations

**Symptom**:
- File with curly apostrophe fails to move: `"User's Guide.md"` (with curly apostrophe) → **Source file not found**
- Error occurs even though file exists and is visible in list_files output

**Root Cause**:
- Apostrophe in filename is U+2019 (RIGHT SINGLE QUOTATION MARK / curly quote `'`) instead of U+0027 (APOSTROPHE `'`)
- Path matching uses strict string comparison, Unicode variant not recognized
- Likely introduced by: Auto-correct in text editors or OS clipboard normalization

**Example**:
```
Filename (actual):   User's Guide.md  (← curly apostrophe U+2019)
User provides:       User's Guide.md  (← straight apostrophe U+0027)
move_file() result:  Error - Source file not found (mismatch)
```

**Workaround**:
- Manually replace curly apostrophe (`'`) with straight apostrophe (`'`) in Obsidian
- Rename file to avoid apostrophes entirely

**Fix for v1.2**:
- Implement Unicode normalization (NFC or NFD) in path validation
- Normalize filenames before path matching in move_file, delete_file, read_file operations
- Add charset detection logging for debugging

---

## Bug #2: Nerd Font Emojis Not Displayed in list_files Output

**Severity**: 🟡 Medium - Causes copy-paste failures, confuses users

**Symptom**:
- `list_files()` returns: `"Tools and Tips Reminder.md"`
- Actual filename in Obsidian: `"🛠️Tools and Tips Reminder.md"` (with hammer emoji)
- Users copy-paste filename from API response, but it doesn't match actual file
- Subsequent move_file fails because provided path has missing emoji

**Root Cause**:
- JSON serialization doesn't handle Nerd Font emojis (variant selectors, zero-width joiners)
- Emoji encoding issue in Express response headers or axios response parsing
- Missing charset declaration or emoji-safe encoding configuration

**Example**:
```json
{
  "name": "Tools and Tips Reminder.md",
  "actual_filename": "🛠️Tools and Tips Reminder.md"
}
```

**Workaround**:
- Use `find_files` to search by text name (works correctly)
- Manually check Obsidian vault to verify emoji presence
- Remove emoji from filename if copy-paste fails

**Fix for v1.2**:
- Add `charset=utf-8` to all JSON responses
- Test with emoji-heavy filenames and verify serialization
- Consider stripping emojis in API responses with `stripEmoji` flag option
- Document emoji limitations and recommendations

---

## Bug #3: ".." at End of Filename Treated as Directory Traversal

**Severity**: 🔴 High - Blocks file operations on validly named files

**Symptom**:
- File: `"employee..md"` (ending with two dots, not a directory reference)
- move_file result: **Error - Invalid path: traversal not allowed**
- Error occurs on SOURCE validation, even though ".." is part of filename, not a path separator

**Root Cause**:
- Path validator checks for `..` anywhere in path without context
- Doesn't distinguish between:
  - Filename content: `employee..md` (valid, user's intention is filename content)
  - Path traversal: `folder/../../other` (invalid, security risk)
- Overly strict regex pattern matching

**Example**:
```
Filename:        "employee..md"
Path parsing:    "employee" + ".." + "md"
Validation:      Treats ".." as directory traversal
Result:          Rejected (but should be allowed as filename content)
```

**Workaround**:
- Rename file to remove double dots: `"employee.md"`
- Manually update filename in Obsidian vault

**Fix for v1.2**:
- Use path parsing library (`path.resolve()`, `path.normalize()`) instead of regex
- Validate AFTER path normalization, not before
- Context-aware validation: Allow `..` in filename if NOT between path separators
- Add unit tests for edge cases: `..md`, `file...txt`, `.hidden`, etc.

---

## Bug #4: Leading/Trailing Spaces in Filenames Fail to Move

**Severity**: 🟡 Medium - Blocks move operations, user must manually fix

**Symptom**:
- File: ` AI Model Limitations.md` (leading space before "A")
- move_file result: **Source file not found**
- Space character invisible in terminal/JSON output, hard to debug
- User manually discovers and removes space to fix

**Root Cause**:
- `list_files` output includes leading space but not visually obvious in console
- Path matching is strict: " AI Model..." ≠ "AI Model..."
- No trimming of filenames during path validation or listing
- Leading/trailing spaces valid in filesystem but problematic for APIs

**Example**:
```
Actual filename:  " AI Model Limitations.md"
Visible output:   "AI Model Limitations.md"
Path passed:      " AI Model Limitations.md" (has space but invisible)
Matching:         FAILS - cannot find " AI Model..." in vault
```

**Workaround**:
- View hex dump or use `xxd` to detect invisible spaces
- Manually remove leading/trailing spaces in Obsidian
- Use find_files with partial name to locate file

**Fix for v1.2**:
- Decide: Auto-trim filenames on write (breaking?), or warn users
- Option A: Trim during write_file/move_file operations with warning log
- Option B: Add `strict_mode` flag to preserve spaces, but warn in list_files output
- Add visual indicator in API responses: `"⎵Perplexity..."` or similar
- Document that Obsidian should enforce filename hygiene

---

## Bug #5: move_file Creates Unnecessary Trash Copies

**Severity**: 🟡 Medium - Wastes disk space with duplicate trash entries

**Symptom**:
- After moving file: `move_file({ source: "BUSINESS/Carriere/file.md", destination: "CARRIERE/file.md" })`
- File successfully moved to CARRIERE/file.md ✓
- But original also appears in `.trash-http-mcp/2025-11-08T...file.md` ⚠️
- Result: Two copies exist (one at destination, one in trash)

**Root Cause**:
- `moveFile` implementation:
  1. Reads file from source
  2. Writes to destination
  3. Calls `deleteFile(source)` WITHOUT permanent=true
- Default `deleteFile` is **soft delete**: Creates trash copy before removing original
- Creates unnecessary duplicate

**Example**:
```
moveFile source:  "BUSINESS/Carriere/Test.md"
moveFile dest:    "CARRIERE/Test.md"

Result:
  ✓ CARRIERE/Test.md (correct)
  ✗ .trash-http-mcp/2025-11-08T15-30-45-Test.md (unnecessary)
```

**Workaround**:
- Manually delete from `.trash-http-mcp/` folder in Obsidian
- Use `delete_file` with permanent=true to clean up trash

**Fix for v1.2**:
- Change `moveFile` to use hard delete (permanent removal) for source
- Implementation: Pass permanent=true flag to deleteFile when called from moveFile
- Or: Directly call `client.deleteFile()` in ObsidianClient with permanent flag
- Code change: ~5 lines in move.ts

**Impact**:
- Saves disk space (no trash duplicates for moved files)
- Prevents user confusion (files appear to be "gone" from original location)

---

## Summary Table

| Bug | Type | Severity | Workaround | v1.2 Fix Effort |
|-----|------|----------|-----------|-----------------|
| #1 | Unicode normalization | 🔴 High | Remove curly quote | 30 min - Add NFC/NFD normalization |
| #2 | Emoji serialization | 🟡 Medium | Use find_files | 45 min - Fix charset + test emoji handling |
| #3 | ".." path validation | 🔴 High | Rename file | 1 hour - Rewrite validator with proper parsing |
| #4 | Whitespace handling | 🟡 Medium | Manual trim | 30 min - Add trim + visual indicator |
| #5 | moveFile trash copies | 🟡 Medium | Manual cleanup | 5 min - Add permanent=true flag |

**Total v1.2 Effort**: ~3.5 hours development + testing

---

## Testing Recommendations

Create test files in vault:
```
user's-guide.md           (curly apostrophe U+2019)
🛠️test.md                 (nerd font emoji with variant selector)
file..md                  (double dot at end)
 leading-space.md         (space before filename)
trailing-space .md        (space before extension)
```

Run through all file operations:
- list_files ✓
- read_file ✓
- move_file ✓
- delete_file ✓
- search ✓

---

## Notes for v1.2 Implementation

1. **Priority**: Fix #1 and #3 first (blocking operations)
2. **Testing**: Add Unicode/special character test suite
3. **Documentation**: Add "Filename Best Practices" guide to README
4. **User Communication**: Include known limitations in release notes
5. **Prevention**: Consider filename validation on write_file to prevent future issues

