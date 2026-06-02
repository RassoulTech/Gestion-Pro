import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfYear, 
  endOfYear 
} from "date-fns";

export type DateRangeOption =
  | "today"
  | "yesterday"
  | "3days"
  | "7days"
  | "15days"
  | "30days"
  | "thismonth"
  | "lastmonth"
  | "3months"
  | "6months"
  | "thisyear"
  | "all"
  | "custom";

export interface DateFilterResult {
  startDate?: Date;
  endDate?: Date;
  whereClause: {
    gte?: Date;
    lte?: Date;
  };
}

export function parseDateFilter(
  range: string | undefined,
  from: string | undefined,
  to: string | undefined
): DateFilterResult {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  let startDate: Date | undefined;
  let endDate: Date | undefined = todayEnd; // Default end of range is the end of today

  const activeRange = (range || "30days") as DateRangeOption;

  switch (activeRange) {
    case "today":
      startDate = todayStart;
      break;
    case "yesterday":
      startDate = startOfDay(subDays(now, 1));
      endDate = endOfDay(subDays(now, 1));
      break;
    case "3days":
      startDate = startOfDay(subDays(now, 2));
      break;
    case "7days":
      startDate = startOfDay(subDays(now, 6));
      break;
    case "15days":
      startDate = startOfDay(subDays(now, 14));
      break;
    case "30days":
      startDate = startOfDay(subDays(now, 29));
      break;
    case "thismonth":
      startDate = startOfMonth(now);
      break;
    case "lastmonth": {
      const prevMonth = subMonths(now, 1);
      startDate = startOfMonth(prevMonth);
      endDate = endOfMonth(prevMonth);
      break;
    }
    case "3months":
      startDate = startOfDay(subMonths(now, 3));
      break;
    case "6months":
      startDate = startOfDay(subMonths(now, 6));
      break;
    case "thisyear":
      startDate = startOfYear(now);
      break;
    case "custom":
      if (from) {
        startDate = startOfDay(new Date(from));
      }
      if (to) {
        endDate = endOfDay(new Date(to));
      } else {
        endDate = undefined;
      }
      break;
    case "all":
    default:
      startDate = undefined;
      endDate = undefined;
      break;
  }

  const whereClause: { gte?: Date; lte?: Date } = {};
  if (startDate) whereClause.gte = startDate;
  if (endDate) whereClause.lte = endDate;

  return {
    startDate,
    endDate,
    whereClause,
  };
}
