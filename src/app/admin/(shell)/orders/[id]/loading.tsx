// 換頁載入骨架：純 server、無 JS、不查 DB；Link 預取時一起帶回，點下去立即顯示。
export default function AdminLoading() {
  return (
    <div className="adm-page adm-skeleton" aria-busy="true">
      <span className="adm-sr" role="status">
        載入中…
      </span>
      <span className="adm-skel adm-skel-title" />
      <span className="adm-skel adm-skel-line" />
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="adm-skel adm-skel-row" />
      ))}
    </div>
  );
}
