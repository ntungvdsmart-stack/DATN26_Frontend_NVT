import { MapPin, Navigation, Check, Warehouse, Users } from 'lucide-react';

const distanceLabel = value => value < 1 ? `${Math.round(value*1000)} m` : `${Number(value).toLocaleString('vi-VN',{maximumFractionDigits:1})} km`;
export default function OrderBranchChoices({ branches, selectedId, onSelect, address }) {
  const located = branches.some(branch => branch.distance != null);
  return <div className="space-y-4">
    <div className="rounded-xl border border-border bg-muted/30 p-4"><h3 className="text-xs font-semibold flex items-center gap-2"><MapPin size={15}/>Địa chỉ giao hàng</h3><p className="text-xs text-muted-foreground leading-6 break-words mt-2">{address || 'Chưa có địa chỉ nhận hàng'}</p></div>
    <div><h3 className="font-semibold text-sm">Bước 1 · Chọn chi nhánh</h3><p className="text-xs text-muted-foreground mt-1.5 leading-5">{located ? 'Xếp từ gần đến xa theo quãng đường từ chi nhánh đến khách. Chi nhánh chưa xác định khoảng cách nằm cuối danh sách.' : 'Chưa tính được khoảng cách. Kiểm tra địa chỉ/tọa độ khách và chi nhánh; danh sách hiện theo mã chi nhánh.'}</p></div>
    <div className="space-y-3 max-h-[42dvh] overflow-y-auto overscroll-contain pr-1">
      {branches.map((branch,index)=>{
        const eligible = branch.hasEnoughStock && branch.staff?.length > 0;
        const selected = String(selectedId) === String(branch.branch_id);
        return <button type="button" key={branch.branch_id} disabled={!eligible} onClick={()=>onSelect(branch.branch_id)} aria-pressed={selected} className={`w-full text-left border rounded-xl p-4 transition-colors disabled:cursor-not-allowed ${selected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-foreground/30'} ${eligible ? '' : 'opacity-60'}`}>
          <div className="flex items-start gap-3"><span className="w-7 h-7 shrink-0 grid place-items-center rounded-lg bg-muted text-xs font-semibold">{index+1}</span><div className="flex-1 min-w-0"><div className="flex flex-wrap justify-between gap-2"><h4 className="font-semibold text-sm break-words">{branch.branch_name}</h4><span className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"><Navigation size={13}/>{branch.distance != null ? distanceLabel(branch.distance) : 'Chưa xác định'}</span></div><p className="text-xs text-muted-foreground mt-2 leading-5 break-words">{branch.address || 'Chưa cập nhật địa chỉ'}</p><p className="text-[10px] text-muted-foreground mt-2 leading-5">{branch.distance_note}{branch.branch_location_source === 'geocoded' ? ' · Vị trí tra từ địa chỉ chi nhánh' : ''}</p><div className="flex flex-wrap gap-3 mt-3 text-[11px]"><span className={`inline-flex items-center gap-1 ${branch.hasEnoughStock?'text-emerald-700 dark:text-emerald-400':'text-red-600'}`}><Warehouse size={13}/>{branch.hasEnoughStock?'Đủ hàng':'Không đủ tồn kho'}</span><span className={`inline-flex items-center gap-1 ${branch.staff?.length?'text-muted-foreground':'text-amber-700 dark:text-amber-400'}`}><Users size={13}/>{branch.staff?.length?`${branch.staff.length} nhân viên có thể nhận đơn`:'Chưa có nhân viên đủ quyền'}</span>{selected&&<span className="inline-flex items-center gap-1 font-medium"><Check size={13}/>Đang chọn</span>}</div></div></div>
        </button>;
      })}
    </div>
  </div>;
}
