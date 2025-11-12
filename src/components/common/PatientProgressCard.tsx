import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Select,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
];

const data = [
  {
    name: "Jan",
    Hypertension: 75,
    Diabetes: 30,
    Feaver: 50,
    Fracture: 20,
    Neck: 5,
    Teath: 1,
  },
  {
    name: "Feb",
    Hypertension: 78,
    Diabetes: 40,
    Feaver: 52,
    Fracture: 22,
    Neck: 4,
    Teath: 2,
  },
  {
    name: "Mar",
    Hypertension: 80,
    Diabetes: 45,
    Feaver: 53,
    Fracture: 25,
    Neck: 3,
    Teath: 1,
  },
  {
    name: "Apr",
    Hypertension: 82,
    Diabetes: 48,
    Feaver: 54,
    Fracture: 26,
    Neck: 3,
    Teath: 1,
  },
  {
    name: "May",
    Hypertension: 85,
    Diabetes: 50,
    Feaver: 55,
    Fracture: 27,
    Neck: 2,
    Teath: 1,
  },
  {
    name: "Jun",
    Hypertension: 88,
    Diabetes: 55,
    Feaver: 56,
    Fracture: 28,
    Neck: 2,
    Teath: 1,
  },
];

const donutData = [
  { name: "Hypertension", value: 15 },
  { name: "Diabetes", value: 35 },
  { name: "Feaver", value: 55 },
  { name: "Fracture", value: 28 },
  { name: "Neck", value: 2 },
  { name: "Teath", value: 1 },
];

const chartOptions = ["Bar Chart", "Line Chart", "Donut Chart"] as const;
type ChartOption = (typeof chartOptions)[number];

const METRICS = Object.keys(data[0]).filter((k) => k !== "name");

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 260,
    },
  },
};

const PatientProgressChart: React.FC = () => {
  const [chartType, setChartType] = useState<ChartOption>("Bar Chart");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "Hypertension",
    "Diabetes",
    "Feaver",
    "Fracture",
    "Neck",
    "Teath",
  ]);

  const handleChartChange = (e: SelectChangeEvent<string>) => {
    setChartType(e.target.value as ChartOption);
  };

  const handleMetricChange = (e: any) => {
    const value = e.target.value as string[];
    setSelectedMetrics(value);
  };

  return (
    <Card
      sx={{
        background: "linear-gradient(to bottom right, #EBF3FF, #E3F2FD)",
        borderRadius: 3,
        boxShadow: 4,
        p: 2,
      }}
    >
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          gap={2}
          flexWrap="wrap"
        >
          <Typography variant="h6" fontWeight={600} color="text.primary">
            Patient Progress{" "}
            <Typography
              variant="body2"
              component="span"
              color="text.secondary"
            ></Typography>
          </Typography>

          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="metric-select-label"></InputLabel>
              <Select
                labelId="metric-select-label"
                multiple
                value={selectedMetrics}
                onChange={handleMetricChange}
                input={<OutlinedInput />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {METRICS.map((metric) => (
                  <MenuItem key={metric} value={metric}>
                    <Checkbox checked={selectedMetrics.indexOf(metric) > -1} />
                    <ListItemText primary={metric} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                labelId="chart-type-label"
                value={chartType}
                onChange={handleChartChange}
              >
                {chartOptions.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box height={360}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${chartType}-${selectedMetrics.join(",")}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "Line Chart" && (
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {selectedMetrics.length === 0 ? (
                      <text x="50%" y="50%" textAnchor="middle">
                        Select metric(s) to display
                      </text>
                    ) : (
                      selectedMetrics.map((m, i) => (
                        <Line
                          key={m}
                          type="monotone"
                          dataKey={m}
                          stroke={COLORS[i % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 6 }}
                        />
                      ))
                    )}
                  </LineChart>
                )}
                {chartType === "Bar Chart" && (
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {selectedMetrics.length === 0 ? (
                      <text x="50%" y="50%" textAnchor="middle">
                        Select metric(s) to display
                      </text>
                    ) : (
                      selectedMetrics.map((m, i) => (
                        <Bar
                          key={m}
                          dataKey={m}
                          fill={COLORS[i % COLORS.length]}
                          stackId={undefined}
                          radius={[6, 6, 0, 0]}
                        />
                      ))
                    )}
                  </BarChart>
                )}
                {chartType === "Donut Chart" && (
                  <PieChart>
                    <Tooltip />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                    />
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="45%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={55}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {donutData.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={COLORS[idx % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                )}
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 1,
            fontStyle: "italic",
          }}
        >
          (*data integration pending)
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PatientProgressChart;
