export function cleanResponse(
  response: string,
  input: string,
  num_words: number = 3
) {
  input = input.trim().toLowerCase();
  response = response.trim().toLowerCase();

  input = input.replace(/[-_]/g, " ");
  response = response
    .replace(/[-_]/g, " ")
    .replace(/[*]/g, "")
    .replace(/["]/g, "")
    .replace(/null/g, "");

  const inputWords = input.split(/\s+/);
  let responseWords = response.split(/\s+/);
  const n = responseWords.length;

  let idxMatched = 0;
  for (let i = 0; i < n; i++) {
    const phrase = responseWords.slice(0, i + 1).join(" ");
    if (input.includes(phrase)) {
      idxMatched = i + 1;
    }
  }
  responseWords = responseWords.slice(idxMatched);

  const lastInputWord = inputWords[inputWords.length - 1];
  idxMatched = 0;
  const matchIndex = responseWords.findIndex((word, index) => {
    return word.toLowerCase() === lastInputWord;
  });

  if (matchIndex !== -1) {
    idxMatched = matchIndex + 1;
  }

  const cleanResponseWords = responseWords.slice(idxMatched);
  const cleanResponse = cleanResponseWords.slice(0, num_words).join(" ");
  return cleanResponse;
}

export function parseResponse(
  jsonResponses: string,
  input: string,
  num_responses = 2,
  num_words = 3
): string[] {
  try {
    const responses = JSON.parse(jsonResponses);

    const parsedResponses: string[] = [];
    let count = 0;
    const n = responses.length;
    for (let i = 0; i < n && count < num_responses; i++) {
      const res = cleanResponse(responses[i], input, num_words);
      if (res && !parsedResponses.includes(res)) {
        count++;
        parsedResponses.push(res);
      }
    }

    return parsedResponses;
  } catch (error) {
    if (jsonResponses.includes("[") || jsonResponses.includes("]")) {
      return [];
    }
    return [cleanResponse(jsonResponses, input, num_words)];
  }
}
