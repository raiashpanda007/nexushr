# Resume Processor – Bug Fixes

## Problem
Raw scores (and normalized scores) were always coming out as `0` for every applicant.

---

## Root Causes & Fixes

### 1. Tokenization mismatch — `tf-calculator.js` & `idf-calculator.js`

**File:** `src/engine/tf-calculator.js` and `src/engine/idf-calculator.js`

**Why it was broken:**
`Tokenizer.js` uses `natural.WordTokenizer` which splits text on any non-alphanumeric character. So a skill like `"Node.js"` found in the resume text gets split into `["node", "js"]`. The `word.length > 2` filter then drops `"js"`, leaving only `"node"` in the token array.

However, both calculators were normalizing the skill name by *removing* special characters: `"Node.js".replace(/[^a-z0-9]/g, '')` → `"nodejs"`. When they then looked for `"nodejs"` in the tokens, it was never found, so `count = 0` → `TF = 0` → `score = 0`.

**Fix:**
Both calculators now tokenize the skill name using the **same strategy** as `Tokenizer.js`:
- Split on non-alphanumeric characters (except `+` and `#` for skills like `C++`, `C#`)
- Filter out parts shorter than 3 characters
- Use the **longest part** as the primary lookup token

Examples:
| Skill name | Old (broken) | New (fixed) |
|---|---|---|
| `"Node.js"` | `"nodejs"` | `"node"` |
| `"React.js"` | `"reactjs"` | `"react"` |
| `"PostgreSQL"` | `"postgresql"` | `"postgresql"` |

---

### 2. IDF always 0 for small or uniform corpora — `idf-calculator.js`

**File:** `src/engine/idf-calculator.js`

**Why it was broken:**
The original IDF formula was `Math.log(totalResumes / resumesWithSkill)`.

- With a **single resume**: `Math.log(1 / 1) = Math.log(1) = 0`
- When **all resumes** contain a skill: `Math.log(N / N) = 0`

This meant `TF * IDF * weight = TF * 0 * weight = 0` in most realistic scenarios.

**Fix:**
Changed to the standard **smoothed IDF** formula:

```
IDF = log(1 + totalResumes / resumesWithSkill)
```

The `+1` ensures the result is always `> 0` when the skill is found, so the score is never zeroed out by a uniform distribution.

---

### 3. Wrong log output in `index.js`

**File:** `src/engine/index.js`

**Why it was broken:**
The log line read:
```js
console.log(`[ATS] Tokenized ${tokens} tokens for ${_id}`);
```
`tokens` is an array, so this printed `[object Object]` instead of the actual count.

**Fix:**
```js
console.log(`[ATS] Tokenized ${tokens.length} tokens for ${_id}`);
```
