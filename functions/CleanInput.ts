export function cleanResponse(
  response: string,
  input: string,
  num_words: number = 3
) {
  console.log("\tBefore:", response);

  input = input.trim().toLowerCase();
  response = response.trim();
  if (!/[.?!]$/.test(input)) {
    response = response.toLowerCase();
  }

  input = input.replace(/[-_]/g, " ");
  response = response.replace(/[-_]/g, " ");
  console.log("First clean:\n", input, "\n", response);

  const inputWords = input.split(/\s+/);
  const responseWords = response.split(/\s+/);
  const n = responseWords.length;

  let idxOverlap = 0;
  let matched = "";

  for (let i = 0; i < n; i++) {
    const phrase = responseWords.slice(0, i + 1).join(" ");
    if (input.includes(phrase)) {
      idxOverlap = i + 1;
      matched = phrase;
    }
  }

  console.log("\tMatched:", matched);

  const cleanResponseWords = responseWords.slice(idxOverlap);
  const cleanResponse = cleanResponseWords.slice(0, num_words).join(" ");

  console.log("\tAfter:", cleanResponse);
  return cleanResponse;
}
