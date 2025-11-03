interface HeaderProps {
  currentBlock: number
}

export function Header({ currentBlock }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">CD</div>
        <h1 className="header-title">CreatorDirect</h1>
      </div>
      <div className="header-right">
        <div className="chain-info">Shibuya Testnet</div>
        <div className="block-number">Block #{currentBlock || '...'}</div>
      </div>
    </header>
  )
}
