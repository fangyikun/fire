declare module 'react-calendar-heatmap' {
  import { Component } from 'react';

  export interface CalendarHeatmapProps {
    values: Array<{
      date: string | Date;
      count: number;
    }>;
    startDate?: Date;
    endDate?: Date;
    classForValue?: (value: { date: string | Date; count: number } | null) => string;
    tooltipDataAttrs?: (value: { date: string | Date; count: number } | null) => Record<string, string>;
    onClick?: (value: { date: string | Date; count: number } | null) => void;
    onMouseOver?: (e: React.MouseEvent, value: { date: string | Date; count: number } | null) => void;
    onMouseLeave?: (e: React.MouseEvent, value: { date: string | Date; count: number } | null) => void;
    showMonthLabels?: boolean;
    showWeekdayLabels?: boolean;
    weekdayLabels?: string[];
    monthLabels?: string[];
    horizontal?: boolean;
    gutterSize?: number;
    square?: boolean;
    transformDayElement?: (rect: React.ReactElement, value: { date: string | Date; count: number } | null, index: number) => React.ReactElement;
  }

  export default class CalendarHeatmap extends Component<CalendarHeatmapProps> {}
}
