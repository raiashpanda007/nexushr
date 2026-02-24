import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

type Item = { reason: string; amount: number };

export type PayrollDocumentProps = {
  base: number;
  hra: number;
  lta: number;
  bonus: Item[];
  deduction: Item[];
  createdAt: string;
  employeeName?: string;
};

const colors = {
  primary: "#4338ca",
  primaryLight: "#eef2ff",
  dark: "#1e1b4b",
  text: "#334155",
  textLight: "#64748b",
  border: "#e2e8f0",
  white: "#ffffff",
  green: "#059669",
  greenLight: "#ecfdf5",
  red: "#dc2626",
  redLight: "#fef2f2",
  accent: "#f8fafc",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: colors.text,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9,
    color: colors.textLight,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    width: "48%",
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.textLight,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.accent,
  },
  tableCell: {
    fontSize: 10,
    color: colors.text,
  },
  tableCellBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.dark,
  },
  colDescription: { width: "60%" },
  colAmount: { width: "40%", textAlign: "right" },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  totalAmount: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 8,
    color: colors.textLight,
  },
  greenText: { color: colors.green },
  redText: { color: colors.red },
});

const formatCurrency = (amount: number) =>
  `$${(Number(amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const PayrollDocument = (props: PayrollDocumentProps) => {
  const bonuses = props.bonus || [];
  const deductions = props.deduction || [];
  const base = Number(props.base) || 0;
  const hra = Number(props.hra) || 0;
  const lta = Number(props.lta) || 0;

  const totalBonus = bonuses.reduce((s, b) => s + Math.abs(Number(b.amount) || 0), 0);
  const totalDeduction = deductions.reduce((s, d) => s + Math.abs(Number(d.amount) || 0), 0);
  const grossSalary = base + hra + lta + totalBonus;
  const netSalary = grossSalary - totalDeduction;

  const date = new Date(props.createdAt);
  const monthYear = date.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>NexusHR</Text>
            <Text style={styles.subtitle}>Payroll Management System</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PAYSLIP</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Employee</Text>
            <Text style={styles.infoValue}>{props.employeeName || "—"}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Pay Period</Text>
            <Text style={styles.infoValue}>{monthYear}</Text>
          </View>
        </View>

        {/* Earnings Table */}
        <Text style={styles.sectionTitle}>Earnings</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellBold, styles.colDescription]}>Base Salary</Text>
            <Text style={[styles.tableCellBold, styles.colAmount]}>{formatCurrency(base)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={[styles.tableCell, styles.colDescription]}>House Rent Allowance (HRA)</Text>
            <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(hra)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colDescription]}>Leave Travel Allowance (LTA)</Text>
            <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(lta)}</Text>
          </View>
          {bonuses.map((b, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colDescription, styles.greenText]}>Bonus: {b.reason}</Text>
              <Text style={[styles.tableCell, styles.colAmount, styles.greenText]}>+{formatCurrency(Math.abs(Number(b.amount) || 0))}</Text>
            </View>
          ))}
          <View style={[styles.tableRow, { backgroundColor: colors.greenLight }]}>
            <Text style={[styles.tableCellBold, styles.colDescription]}>Total Earnings</Text>
            <Text style={[styles.tableCellBold, styles.colAmount, styles.greenText]}>{formatCurrency(grossSalary)}</Text>
          </View>
        </View>

        {/* Deductions Table */}
        {deductions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Deductions</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
              </View>
              {deductions.map((d, i) => (
                <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, styles.colDescription, styles.redText]}>{d.reason}</Text>
                  <Text style={[styles.tableCell, styles.colAmount, styles.redText]}>-{formatCurrency(Math.abs(Number(d.amount) || 0))}</Text>
                </View>
              ))}
              <View style={[styles.tableRow, { backgroundColor: colors.redLight }]}>
                <Text style={[styles.tableCellBold, styles.colDescription]}>Total Deductions</Text>
                <Text style={[styles.tableCellBold, styles.colAmount, styles.redText]}>-{formatCurrency(totalDeduction)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Net Salary */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Net Salary</Text>
          <Text style={styles.totalAmount}>{formatCurrency(netSalary)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</Text>
          <Text style={styles.footerText}>NexusHR — Confidential</Text>
        </View>
      </Page>
    </Document>
  );
};