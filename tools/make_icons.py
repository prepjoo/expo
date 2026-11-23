# 삼지작법 아이콘(田 창문 틀 + Z 순서선) 만들기: python3 tools/make_icons.py → crib.png, prep.png, awha.png
from PIL import Image, ImageDraw, ImageFont
S=4; N=512*S
FONT='/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
RED,BLUE,GREEN=(192,0,0),(0,112,192),(0,176,80)
PEACH=(242,196,174); ZC=(61,75,110)
SETS={'crib':[('C',GREEN),('R',BLUE),('I',RED),('B',BLUE)],
      'prep':[('P',RED),('R',BLUE),('E',GREEN),('P',RED)],
      'awha':[('A',RED),('W',BLUE),('H',GREEN),('A',RED)]}
def s(v): return int(v*S)
for name,lets in SETS.items():
    im=Image.new('RGBA',(N,N),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle([s(28),s(28),s(484),s(484)],radius=s(44),outline=PEACH,width=s(12))
    d.line([s(256),s(28),s(256),s(484)],fill=PEACH,width=s(12))
    d.line([s(28),s(256),s(484),s(256)],fill=PEACH,width=s(12))
    f=ImageFont.truetype(FONT,s(150))
    cx=[s(140),s(372)]; cy=[s(138),s(374)]
    for i,(ch,col) in enumerate(lets):
        x=cx[i%2]; y=cy[i//2]
        d.text((x,y),ch,font=f,fill=col,anchor='mm')
    # Z 순서선 (두 줄 사이, 글자에 닿지 않게)
    w=s(9); x0,x1=s(176),s(336); ya,yb=s(222),s(290)
    for a,b in [((x0,ya),(x1,ya)),((x1,ya),(x0,yb)),((x0,yb),(x1-s(10),yb))]:
        d.line([a,b],fill=ZC,width=w)
    for p in [(x0,ya),(x1,ya),(x0,yb)]:
        d.ellipse([p[0]-w//2,p[1]-w//2,p[0]+w//2,p[1]+w//2],fill=ZC)
    ah=s(22); d.polygon([(x1+s(12),yb),(x1-s(14),yb-ah*0.7),(x1-s(14),yb+ah*0.7)],fill=ZC)
    im.resize((512,512),Image.LANCZOS).save(f'{name}.png',optimize=True)
# preview sheet
pv=Image.new('RGB',(512*3+80,592),(247,245,239))
for i,n in enumerate(['crib','prep','awha']):
    t=Image.open(f'{n}.png'); pv.paste(t,(20+i*532,40),t)
pv.save('preview.png')
