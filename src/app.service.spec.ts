import { AppService } from './app.service';

describe('AppService', () => {
  it('returns operational health metadata', () => {
    const service = new AppService();

    expect(service.getHealth()).toEqual({
      status: 'ok',
      service: 'carauction-backend',
      version: '0.1.0',
    });
  });

  it('returns backend version metadata', () => {
    const service = new AppService();

    expect(service.getVersion()).toEqual({
      service: 'carauction-backend',
      version: '0.1.0',
    });
  });
});
