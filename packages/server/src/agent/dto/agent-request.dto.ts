// import { IsString, IsNotEmpty } from 'class-validator';

function IsString() {
  return (target: any, propertyName: string) => {
    const metadata = target[propertyName];
    if (typeof metadata !== 'string') {
      throw new Error('Property must be a string');
    }
  };
}

function IsNotEmpty() {
  return (target: any, propertyName: string) => {
    const value = target[propertyName];
    if (value === undefined || value === null || value === '') {
      throw new Error('Property cannot be empty');
    }

    return value;
  };
}
// 校验前端传入的参数（防止非法输入）
export class AgentRequestDto {
  @IsString() // 必须是字符串
  @IsNotEmpty() // 不能为空
  prompt: string;
}
