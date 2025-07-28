# LLM Text Autocomplete

[![npm version](https://img.shields.io/npm/v/react-native-executorch?color=00008B)](https://www.npmjs.com/package/react-native-executorch)
[![react-native](https://img.shields.io/badge/react--native-0.79.5-61dafb.svg?logo=react)](https://github.com/facebook/react-native/releases/tag/v0.79.5)

**React Native ExecuTorch** is a declarative way to run AI models in React Native on device, powered by **ExecuTorch** :rocket:. It offers out-of-the-box support for many LLMs, computer vision models, and many many more. Feel free to check them out on our [HuggingFace page](https://huggingface.co/software-mansion).

**ExecuTorch** is a novel framework created by Meta that enables running AI models on devices such as mobile phones or microcontrollers.

React Native ExecuTorch bridges the gap between React Native and native platform capabilities, allowing developers to run AI models locally on mobile devices with state-of-the-art performance, without requiring deep knowledge of native code or machine learning internals.

## Requirements

- iOS 17.0
- Android 13
- React Native 79
- React 19

> The project uses React Native Executorch that supports only the New React Native architecture.

## Usag

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

To select the LLM model used in the application, adjust the configuration in the file **/components/AutoComplete.tsx**:

```tsx
import {
  useLLM,
  LLAMA3_2_1B,
  LLAMA3_2_TOKENIZER,
  LLAMA3_2_TOKENIZER_CONFIG,
} from "react-native-executorch";

const llm = useLLM({
  modelSource: LLAMA3_2_1B,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
});
```

### Ready-to-use models

https://docs.swmansion.com/react-native-executorch/docs/natural-language-processing/useLLM

## License

This code is licensed under [the MIT License](./LICENSE).
