type PageContainerProps = {
  children: React.ReactNode;
};

export function PageContainer({ children }: PageContainerProps) {
  return <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>;
}
