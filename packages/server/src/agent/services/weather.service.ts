import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WeatherService {
  async getWeather(): Promise<string> {
    const cityCode = '101010100';
    const res = await axios.get(
      `http://t.weather.itboy.net/api/weather/city/${cityCode}`,
    );
    if (res.status === 200) {
      return JSON.stringify(res.data);
    }
    return '无法获取天气信息';
  }
}
