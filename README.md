# LLM Text Autocomplete

[![npm version](https://img.shields.io/npm/v/react-native-executorch?color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![react-native](https://img.shields.io/badge/react--native-0.79.5-61dafb.svg?logo=react)](https://github.com/facebook/react-native/releases/tag/v0.79.5)

This project is a mobile autocomplete app that provides real-time text suggestions. It is built with React Native and powered by LLM models running locally using ExecuTorch.

## Requirements

- iOS 17.0
- Android 13
- React Native 79
- React 19

> The project uses React Native Executorch that supports only the New React Native architecture.

## Usage

To test the app, navigate to the project directory and install dependencies with:

```bash
npx expo install
```

Then run the app with:

```bash
npx expo run:ios
```

> Running LLMs requires a significant amount of RAM. In case of unexpected application crashes, try increasing the amount of RAM in the simulator.

## Setup

To select the LLM model used in the application, adjust the configuration in the file **/constants/Model.ts**:

```tsx
import {
  LLAMA3_2_1B,
  LLAMA3_2_TOKENIZER,
  LLAMA3_2_TOKENIZER_CONFIG,
} from "react-native-executorch";

export const modelSource = LLAMA3_2_1B;
export const tokenizerSource = LLAMA3_2_TOKENIZER;
export const tokenizerConfigSource = LLAMA3_2_TOKENIZER_CONFIG;
```

### Ready-to-use models

More details on available models and the requirements in the [documentation](https://docs.swmansion.com/react-native-executorch/docs/natural-language-processing/useLLM#benchmarks).

## License

This code is licensed under [the MIT License](./LICENSE).
