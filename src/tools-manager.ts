import fs from 'fs';
import { AITool } from './types/types';
import toolList from './tools/index';
import WriteMemoryTool from './tools/write-memory-tool';

const tools: AITool[] = [];

toolList.forEach((toolClass) => {
  const instance = new toolClass();
  if (instance.isActivated) {
    tools.push(instance.buildTool());
  }
});
console.log(tools);
const readMemory = () => {
  const memoryFilePath = `./${WriteMemoryTool.MEMORY_FILE}`;
  if (!fs.existsSync(memoryFilePath)) {
    fs.writeFileSync(memoryFilePath, '', 'utf8');
  }
  const memoryData = fs.readFileSync(memoryFilePath, 'utf8');
  return memoryData;
};

export { tools, readMemory };
