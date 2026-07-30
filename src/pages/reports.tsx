// import React, { useState } from 'react';
// import { useGetReportSummary, useGetReportTimeseries } from '@workspace/api-client-react';
// import { StatCard } from '@/components/stat-card';
// import { 
//   BarChart3, 
//   TrendingUp, 
//   Target, 
//   ShoppingCart,
//   CalendarDays
// } from 'lucide-react';
// import { format, subDays } from 'date-fns';
// import { useLanguage } from '@/hooks/use-language';
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip as RechartsTooltip,
//   ResponsiveContainer,
//   AreaChart,
//   Area
// } from 'recharts';

// export default function ReportsPage() {
//   const [dateRange, setDateRange] = useState({
//     from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
//     to: format(new Date(), 'yyyy-MM-dd')
//   });

//   const { data: summary, isLoading: summaryLoading } = useGetReportSummary(dateRange);
//   const { data: timeseries, isLoading: timeseriesLoading } = useGetReportTimeseries(dateRange);
//   const { t } = useLanguage();

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'SAR',
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   return (
//     <div className="space-y-8 animate-in fade-in duration-500">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.reports.title}</h1>
//           <p className="text-muted-foreground mt-1">{t.reports.subtitle}</p>
//         </div>
//         <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-md text-sm">
//           <CalendarDays className="h-4 w-4 text-muted-foreground" />
//           <span className="font-medium">{t.reports.last30Days}</span>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <StatCard
//           title={t.reports.totalRevenue}
//           value={summaryLoading ? '...' : formatCurrency(summary?.totalRevenue || 0)}
//           icon={<TrendingUp className="h-4 w-4 text-primary" />}
//         />
//         <StatCard
//           title={t.reports.averageOrderValue}
//           value={summaryLoading ? '...' : formatCurrency(summary?.averageOrderValue || 0)}
//           icon={<ShoppingCart className="h-4 w-4" />}
//         />
//         <StatCard
//           title={t.reports.recoveryRate}
//           value={summaryLoading ? '...' : `${(summary?.conversionRate || 0).toFixed(1)}%`}
//           icon={<Target className="h-4 w-4" />}
//           description={`${summary?.recoveredCarts || 0} / ${summary?.abandonedCarts || 0}`}
//         />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Revenue Chart */}
//         <div className="border border-border bg-card rounded-xl p-6">
//           <div className="flex items-center gap-2 mb-6">
//             <BarChart3 className="h-5 w-5 text-muted-foreground" />
//             <h3 className="font-semibold text-lg">{t.reports.revenueTrend}</h3>
//           </div>
//           <div className="h-[300px] w-full">
//             {timeseriesLoading ? (
//               <div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading chart...</div>
//             ) : (
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
//                   <defs>
//                     <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
//                       <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
//                   <XAxis 
//                     dataKey="date" 
//                     tickFormatter={(val) => format(new Date(val), 'MMM d')}
//                     axisLine={false}
//                     tickLine={false}
//                     tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
//                     dy={10}
//                   />
//                   <YAxis 
//                     axisLine={false}
//                     tickLine={false}
//                     tickFormatter={(val) => `SAR ${val}`}
//                     tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
//                     width={80}
//                   />
//                   <RechartsTooltip 
//                     contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
//                     labelFormatter={(val) => format(new Date(val), 'MMMM d, yyyy')}
//                     formatter={(value: number) => [formatCurrency(value), 'Revenue']}
//                   />
//                   <Area 
//                     type="monotone" 
//                     dataKey="revenue" 
//                     stroke="hsl(var(--primary))" 
//                     strokeWidth={2}
//                     fillOpacity={1} 
//                     fill="url(#colorRevenue)" 
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             )}
//           </div>
//         </div>

//         {/* Recovery Chart */}
//         <div className="border border-border bg-card rounded-xl p-6">
//           <div className="flex items-center gap-2 mb-6">
//             <Target className="h-5 w-5 text-muted-foreground" />
//             <h3 className="font-semibold text-lg">{t.reports.cartRecovery}</h3>
//           </div>
//           <div className="h-[300px] w-full">
//             {timeseriesLoading ? (
//               <div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading chart...</div>
//             ) : (
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={timeseries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
//                   <XAxis 
//                     dataKey="date" 
//                     tickFormatter={(val) => format(new Date(val), 'MMM d')}
//                     axisLine={false}
//                     tickLine={false}
//                     tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
//                     dy={10}
//                   />
//                   <YAxis 
//                     axisLine={false}
//                     tickLine={false}
//                     tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
//                     width={40}
//                   />
//                   <RechartsTooltip 
//                     contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
//                     labelFormatter={(val) => format(new Date(val), 'MMMM d, yyyy')}
//                   />
//                   <Line 
//                     type="monotone" 
//                     dataKey="abandonedCarts" 
//                     name="Abandoned"
//                     stroke="hsl(var(--muted-foreground))" 
//                     strokeWidth={2}
//                     dot={false}
//                   />
//                   <Line 
//                     type="monotone" 
//                     dataKey="recoveredCarts" 
//                     name="Recovered"
//                     stroke="hsl(var(--success))" 
//                     strokeWidth={2}
//                     dot={false}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


export default function ReportsPage() {

  return <></>
}