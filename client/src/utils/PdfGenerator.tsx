import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

type Item = { reason: string; amount: number };

type Props = {
  BaseSalary: number;
  HRA: number;
  LTA: number;
  Bonus: Item[];
  Deduction: Item[];
};

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 12 },
  title: { fontSize: 22, textAlign: "center", marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  bold: { fontWeight: "bold" },
});

export const PayrollDocument = (props: Props) => {
  const totalBonus = props.Bonus.reduce((s, b) => s + b.amount, 0);
  const totalDeduction = props.Deduction.reduce((s, d) => s + d.amount, 0);

  const net =
    props.BaseSalary + props.HRA + props.LTA + totalBonus - totalDeduction;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Payroll Slip</Text>

        <View style={styles.row}><Text>Base</Text><Text>{props.BaseSalary}</Text></View>
        <View style={styles.row}><Text>HRA</Text><Text>{props.HRA}</Text></View>
        <View style={styles.row}><Text>LTA</Text><Text>{props.LTA}</Text></View>

        <View style={[styles.row, styles.bold]}>
          <Text>Net Salary</Text>
          <Text>{net}</Text>
        </View>
      </Page>
    </Document>
  );
};