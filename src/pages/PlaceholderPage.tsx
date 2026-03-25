import { Card, Typography } from 'antd';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <Card>
        <Typography.Paragraph style={{ marginBottom: 0 }}>{description}</Typography.Paragraph>
      </Card>
    </div>
  );
}
