import { connectDB } from '@/lib/mongodb';
import { Bill } from '@/lib/models/Restaurant';
import { notFound } from 'next/navigation';

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

type PageProps = {
  params: Promise<{ billNumber: string }>;
};

export default async function BillPage({ params }: PageProps) {
  await connectDB();
  const { billNumber } = await params;
  const bill = await Bill.findOne({ billNumber }).lean<any>();

  if (!bill) notFound();

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Restaurant Bill</h1>
            <p className="text-sm text-muted-foreground">Bill #{bill.billNumber}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Table {bill.tableNumber || '-'}</p>
            <p>{bill.partyName || 'Walk-in Guest'}</p>
          </div>
        </div>

        <div className="mb-6 grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="font-medium">Bill Date:</span> {new Date(bill.billDate).toLocaleString()}</p>
          <p><span className="font-medium">Payment Status:</span> {bill.paymentStatus}</p>
          <p><span className="font-medium">Total:</span> {money(bill.totalAmount)}</p>
          <p><span className="font-medium">Items:</span> {bill.items?.length || 0}</p>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items?.map((item: any, index: number) => (
                <tr key={`${bill.billNumber}-${index}`} className="border-t">
                  <td className="px-4 py-3">{item.itemName}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{money(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right">{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(bill.subtotal || 0)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{money(bill.tax || 0)}</span></div>
          <div className="flex justify-between"><span>Service Charge</span><span>{money(bill.serviceCharge || 0)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>-{money(bill.discount || 0)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Total Amount</span><span>{money(bill.totalAmount || 0)}</span></div>
        </div>
      </div>
    </main>
  );
}
