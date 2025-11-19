// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 19952288341979416997664212725272188520068148077381849448569102613474617866090;
    uint256 constant alphay  = 1454336199536719983387810509716418856103762968214377805958230985924968836518;
    uint256 constant betax1  = 21595144773989370072309182820890163652262439880166286537515018676379413067807;
    uint256 constant betax2  = 14577032232673863920877173329093774364305949742239834406056456796862040730508;
    uint256 constant betay1  = 11404795870316129419734321811227659628025756640726487278411584328971371920164;
    uint256 constant betay2  = 14068907886063862112556935859758366835241491938108842584817746127483414517204;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 21554581649519684968222799700366594720488253307319646493170879393311646586093;
    uint256 constant deltax2 = 3213700737576654539662087758781987088882097699502190851868500216758299729608;
    uint256 constant deltay1 = 21787720595851775144268762679418121015452007601726208256864138513242315824696;
    uint256 constant deltay2 = 2688307404121366531475657795944026193561048806971509253391333291367589440415;

    
    uint256 constant IC0x = 9322105206766442929704043984882170439928775045497740370745542780894349004599;
    uint256 constant IC0y = 18847888753078816417867038122544418085516216167372497582765419675648405548482;
    
    uint256 constant IC1x = 13005709197734526922577435726452204807956313133714351048536278704050440827946;
    uint256 constant IC1y = 14434338386606422827488311477408642016073905249482550609319878965524960296189;
    
    uint256 constant IC2x = 20320819132956430346178396585195476404432135479775538851003546218318634988802;
    uint256 constant IC2y = 16794559383878944033037932789866921895272451909210033356668903473942009519178;
    
    uint256 constant IC3x = 5452370431369106503958964212260512707669037276177734557688371493025056502646;
    uint256 constant IC3y = 8337948080157151553779751752583055098460413382667837384218676939826365076731;
    
    uint256 constant IC4x = 7494687915126063449243087551326124122995313287633535784401630150088392448993;
    uint256 constant IC4y = 1119096161798628792643730802366229678094496006140104066228150381076692366157;
    
    uint256 constant IC5x = 10084593886885962350390799955191248271475139257572765516599688788141263181215;
    uint256 constant IC5y = 21672769706671775680815044694006902048283433199292991705311751200267269205434;
    
    uint256 constant IC6x = 15732857688067827725165515083767860869618728636319129147869526567341353392451;
    uint256 constant IC6y = 1329146949580631560675223924313433462499972536500591069093304537012227413108;
    
    uint256 constant IC7x = 17498968583187656585088334603600313631933761227996929657979061859199033717914;
    uint256 constant IC7y = 7586552261792439567292987543971892535666133782360320012715353407396622101010;
    
    uint256 constant IC8x = 9969385395310012401948756032908165868745816608556011718597405278274563378257;
    uint256 constant IC8y = 5999816681339491959291654002347077179014476863724295537244048761238870393908;
    
    uint256 constant IC9x = 10332636370722746254762860601133202227062669265273415327473451722751190654139;
    uint256 constant IC9y = 14088889892247376680431222151083652199669171055914405619197791960575114909849;
    
    uint256 constant IC10x = 14115780571950857213806941262421487169903588593024800419493365848600342891195;
    uint256 constant IC10y = 7025040185438892555895915016520756458160001379175179149549237928710298838362;
    
    uint256 constant IC11x = 5432313975327460605270730647261299769084925713793328565634739887003828262795;
    uint256 constant IC11y = 20729773395600415344298113723852559216375642872719440298422922626181621513522;
    
    uint256 constant IC12x = 17623471451529691847315660717749852441242186046916585966222775908998457785393;
    uint256 constant IC12y = 21362348074410150467382364256451998120729846984790564607140303048911657666946;
    
    uint256 constant IC13x = 16459191635170180335795200727779190923983464513751029023055194372233918897648;
    uint256 constant IC13y = 8543545247902241345942790499197398863728520962553776305945123111918160041972;
    
    uint256 constant IC14x = 14468235529482293281742634563075606612277501104004162129575421918186497383649;
    uint256 constant IC14y = 15110354872107777736273939819387973521895665307683173873693292900654174834074;
    
    uint256 constant IC15x = 15128713893301105960764643075295772192959160211939803187300348330287288926153;
    uint256 constant IC15y = 21688848813886023496652429130285795925554549678763839711889608979975447689632;
    
    uint256 constant IC16x = 10235511243120097984522843837372150201672586791017268651566837911471984489951;
    uint256 constant IC16y = 8444140746470223853957207147202991883410526040039521609801714936447874706018;
    
    uint256 constant IC17x = 2927591518359907924973459744581210143325719043141790349133212317485073770003;
    uint256 constant IC17y = 1664349346832366214411556063282792788121679409366677627290170528216043086863;
    
    uint256 constant IC18x = 18789814541715370309626271405132962695918652951104765663961246113213216949582;
    uint256 constant IC18y = 14836908048293853970259712014717732467392625548202942295248878828797286964197;
    
    uint256 constant IC19x = 1028920080206831902340717204410576131017243698936779915156049065197128186229;
    uint256 constant IC19y = 13839995915229421745722177327946721956053190900463338245666911786064179088109;
    
    uint256 constant IC20x = 11208944593073153121129441209008583022968408769608452056680595687093229298919;
    uint256 constant IC20y = 13260413781667247916321109933969867099263512481742411540120193673952568144115;
    
    uint256 constant IC21x = 403077673427210672170391157969818917413870659130003797203215196058683195924;
    uint256 constant IC21y = 749279237494230394859850065907414158829222100159033315114102087798174857930;
    
    uint256 constant IC22x = 16965464371228119623585196183008379886585509059216981389575171914081803352333;
    uint256 constant IC22y = 14367003429209697572168200688388956511601682076772602164644334673498091487402;
    
    uint256 constant IC23x = 228623993357346634936320381036960878800449943861761339368005662256368946577;
    uint256 constant IC23y = 9675619927660224540894634766508364628299295210215480453349034246549960676589;
    
    uint256 constant IC24x = 442292644041756331949048161231300230616837629931693808086309230926893335934;
    uint256 constant IC24y = 16557546022058419458646875263927469791786488801605696498988485447357169180415;
    
    uint256 constant IC25x = 9162382642456177021201318576047841472105801504433431385936300823857137236772;
    uint256 constant IC25y = 7753385393424113211038523869252998665816120190533142203916957125294992258376;
    
    uint256 constant IC26x = 7842098749634041399249428703702657154705122815202777184748990783493097587597;
    uint256 constant IC26y = 17105898324474698297837066334614177820107060782213510899813198900851909211819;
    
    uint256 constant IC27x = 8619829927075240366544883718107579200637715908116948129638624436534145378915;
    uint256 constant IC27y = 19590785279237789753366984458357804602207157326062504573620932758602000073601;
    
    uint256 constant IC28x = 19951534247519604442802210532390384775235815019373253267613218178555205436705;
    uint256 constant IC28y = 15800256942198003101654700530854358258375660926403585617400256011176626747068;
    
    uint256 constant IC29x = 6368060422015604059150523950343020780992057985840790425780968166374183637482;
    uint256 constant IC29y = 8954254428784774671903370282565256864368744041174732391421274761951541541105;
    
    uint256 constant IC30x = 13565944679569580373450016481968972372711982029410606939799574457724890701895;
    uint256 constant IC30y = 13693506337884459481695242877254094399353772309448471258176713813210969316050;
    
    uint256 constant IC31x = 13870760269998905375271649083914702957029106532247723255263751802126247488783;
    uint256 constant IC31y = 10020910012929596918194580409113907365068703013969399786491349616814968241253;
    
    uint256 constant IC32x = 6278244485449625923306180019413424002379828262735621436048931749425789707989;
    uint256 constant IC32y = 9557844299780227058701910331931440737467123244249761642533214191680010009592;
    
    uint256 constant IC33x = 14863914089708537413572283932485622728320462656387697639507609740608977096491;
    uint256 constant IC33y = 7476301009880672251451584971227358679087718035023604583121689308732548029567;
    
    uint256 constant IC34x = 20084600149056214867331832683692407502189989081557153350160402793948405478425;
    uint256 constant IC34y = 9301672627337249421023129980840242623181575551798822434119680805858788462705;
    
    uint256 constant IC35x = 14172969474860840187120627460127260165430608819223257911335197378895055338596;
    uint256 constant IC35y = 16300035389375541690114440175576910641650812621833871672707362074236842012679;
    
    uint256 constant IC36x = 3026420412154745196706534691420601490880375741003260740282464576123714560034;
    uint256 constant IC36y = 11125334124610713759465203862915687676329991275117742360459149693530892527173;
    
    uint256 constant IC37x = 16183843485768113611463452504497289580186545890674980178704093201474885860620;
    uint256 constant IC37y = 20758077826367413451092572359466658778489183607015250005857642822610107973887;
    
    uint256 constant IC38x = 12331119271566876311038806630119116731449759236351237033257488891727843892586;
    uint256 constant IC38y = 17235847700235498817683501905478165247977408641736771711897753307922574544294;
    
    uint256 constant IC39x = 2983752682662114725943452317138608325268600047510884709260975126567421639004;
    uint256 constant IC39y = 1347241033918203371109235535721371471418080592070169558787003957400088166244;
    
    uint256 constant IC40x = 3999832987185708024364223081886652599301224127901880221197468248961017340613;
    uint256 constant IC40y = 13022311381186257821128120184565328119287066883175402373656268812887901745390;
    
    uint256 constant IC41x = 18575987734035781492075704301158609483027887801364151227499984826564570097148;
    uint256 constant IC41y = 599659984655705626637522902488870658402369856173705943243955068467179823154;
    
    uint256 constant IC42x = 3750381396576899226778977106915519536590673924712342988009702277908739696491;
    uint256 constant IC42y = 1740288309842602283025340025629188720908405838155471193520540713129095634966;
    
    uint256 constant IC43x = 13832074607737547614745518070399622816394656319652286061380646743124851548680;
    uint256 constant IC43y = 19125325560514905718890345467098238452387616982718431604961686746753556452756;
    
    uint256 constant IC44x = 20182841056831106456459432364911204975967400609772707055061734802498603282933;
    uint256 constant IC44y = 8134925910674481837507185456092083064623110258764465089020199770553647453007;
    
    uint256 constant IC45x = 13659829473295025575559752209924601326088329670929405747637038487978922661931;
    uint256 constant IC45y = 12446155074249641870652462176611221161073305185776629073612877598989580588085;
    
    uint256 constant IC46x = 11291654380490885083042810938329921026623500420383021322915337563065411908972;
    uint256 constant IC46y = 13201812992381294732855765660429212970944662969323918682547847610589534869434;
    
    uint256 constant IC47x = 9322204063094183495144182939915544061852245232272888474392102098026677342746;
    uint256 constant IC47y = 8785831039833885230364537916631950363755245211466235883113201455753150558338;
    
    uint256 constant IC48x = 17749884468641208347674822369480640145523734215874987937324640811174619938066;
    uint256 constant IC48y = 2234427996507597576077511763395477399501601969584683269317892706687296881753;
    
    uint256 constant IC49x = 20494334339155726839658082820250787754605559482501481855470569738218336608086;
    uint256 constant IC49y = 15559109713968960425260107234000171214230189457324469089835058910254075999020;
    
    uint256 constant IC50x = 1198196548807203936669311160914485358086746762076516986337392172403945095724;
    uint256 constant IC50y = 6312849959019809971744459444403092761111668839546837542738366257416171218884;
    
    uint256 constant IC51x = 9434944707859308371458350519489762346562812084346258716934654295430221176021;
    uint256 constant IC51y = 18712821508695121526561394935674773298635555331473712610776964112412434572737;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[51] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                
                g1_mulAccC(_pVk, IC37x, IC37y, calldataload(add(pubSignals, 1152)))
                
                g1_mulAccC(_pVk, IC38x, IC38y, calldataload(add(pubSignals, 1184)))
                
                g1_mulAccC(_pVk, IC39x, IC39y, calldataload(add(pubSignals, 1216)))
                
                g1_mulAccC(_pVk, IC40x, IC40y, calldataload(add(pubSignals, 1248)))
                
                g1_mulAccC(_pVk, IC41x, IC41y, calldataload(add(pubSignals, 1280)))
                
                g1_mulAccC(_pVk, IC42x, IC42y, calldataload(add(pubSignals, 1312)))
                
                g1_mulAccC(_pVk, IC43x, IC43y, calldataload(add(pubSignals, 1344)))
                
                g1_mulAccC(_pVk, IC44x, IC44y, calldataload(add(pubSignals, 1376)))
                
                g1_mulAccC(_pVk, IC45x, IC45y, calldataload(add(pubSignals, 1408)))
                
                g1_mulAccC(_pVk, IC46x, IC46y, calldataload(add(pubSignals, 1440)))
                
                g1_mulAccC(_pVk, IC47x, IC47y, calldataload(add(pubSignals, 1472)))
                
                g1_mulAccC(_pVk, IC48x, IC48y, calldataload(add(pubSignals, 1504)))
                
                g1_mulAccC(_pVk, IC49x, IC49y, calldataload(add(pubSignals, 1536)))
                
                g1_mulAccC(_pVk, IC50x, IC50y, calldataload(add(pubSignals, 1568)))
                
                g1_mulAccC(_pVk, IC51x, IC51y, calldataload(add(pubSignals, 1600)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            
            checkField(calldataload(add(_pubSignals, 1184)))
            
            checkField(calldataload(add(_pubSignals, 1216)))
            
            checkField(calldataload(add(_pubSignals, 1248)))
            
            checkField(calldataload(add(_pubSignals, 1280)))
            
            checkField(calldataload(add(_pubSignals, 1312)))
            
            checkField(calldataload(add(_pubSignals, 1344)))
            
            checkField(calldataload(add(_pubSignals, 1376)))
            
            checkField(calldataload(add(_pubSignals, 1408)))
            
            checkField(calldataload(add(_pubSignals, 1440)))
            
            checkField(calldataload(add(_pubSignals, 1472)))
            
            checkField(calldataload(add(_pubSignals, 1504)))
            
            checkField(calldataload(add(_pubSignals, 1536)))
            
            checkField(calldataload(add(_pubSignals, 1568)))
            
            checkField(calldataload(add(_pubSignals, 1600)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
