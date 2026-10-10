import { Bell } from "lucide-react";
import { prisma } from "@/shared/db/prisma";
import { requireUser } from "@/shared/platform/auth";
import { NotificationReadButton } from "@/components/portal/notification-read-button";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({ where: { recipientId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return <div className="space-y-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><Bell className="size-5" /></span><div><h1 className="text-2xl font-semibold tracking-tight">Notifications</h1><p className="mt-1 text-sm text-slate-500">Updates about requests, payroll, and employee services.</p></div></div><div className="max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{notifications.map((item) => <article key={item.id} className={`flex items-start justify-between gap-4 border-b border-slate-100 p-4 last:border-0 ${item.readAt ? "" : "bg-teal-50/40"}`}><div><h2 className="text-sm font-semibold text-slate-800">{item.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p><p className="mt-1.5 text-[10px] text-slate-400">{item.createdAt.toLocaleString("en-PH", { timeZone: "Asia/Manila" })}{item.readAt ? " · Read" : " · Unread"}</p></div>{!item.readAt && <NotificationReadButton id={item.id} />}</article>)}{notifications.length === 0 && <p className="p-8 text-center text-sm text-slate-500">You are all caught up. Notifications created by the system will appear here.</p>}</div></div>;
}
