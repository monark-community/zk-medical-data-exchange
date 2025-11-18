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
    uint256 constant alphax  = 15244594451990552579086330217595979168892097170166850629122217745923773518934;
    uint256 constant alphay  = 10954575424625237033033744987170097158757850213642302125237246354383937093160;
    uint256 constant betax1  = 899812328144465369064747759710294434842933341230862291086633374703184657531;
    uint256 constant betax2  = 9428772009991256234576489360406065537317619707467360669876265629408786892936;
    uint256 constant betay1  = 1000895717800806189013451922479707008254818889699823151236684513890064140500;
    uint256 constant betay2  = 10612734653081132436628998091213038931668348108304668826921453374606160090586;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 20777093399596011179261493377866284318221666772345726337107943663709298547800;
    uint256 constant deltax2 = 3980584746288953475670450022543903379070183646559652442015237072100984122114;
    uint256 constant deltay1 = 15693533607118399372108802241881188128509901079597627185891116167038424966129;
    uint256 constant deltay2 = 15573981497085368685723847191238338770063523891204607396011228471227194216977;

    
    uint256 constant IC0x = 16111382222386135921909366687891084625870512369782928756387085570656072692423;
    uint256 constant IC0y = 14536422108123131589546999738105304336708572405295744162832151857800943869840;
    
    uint256 constant IC1x = 17101153403077473996684548497276378663660791278401380263471730397341744919947;
    uint256 constant IC1y = 5965419755415232346949414208428404460608464056509827229835844747630300925242;
    
    uint256 constant IC2x = 18885835972376175936358732865831126303759385681935022155899503866112257707573;
    uint256 constant IC2y = 13672634987484568930877715308732686500228935864044564247551224822796043797922;
    
    uint256 constant IC3x = 1859679976153919779009501264775506966137705823060111624447742253241946403352;
    uint256 constant IC3y = 8881306874072637991280130916354036285960259611062454529735788064540288241384;
    
    uint256 constant IC4x = 8527578637034434385985100362192646733512682419299601840028333788839588659894;
    uint256 constant IC4y = 9899109668927888723255036865961988421516385373964409053607404697500714677753;
    
    uint256 constant IC5x = 15993472910015612360873532373988770924222741131033850439616764988891110210762;
    uint256 constant IC5y = 18408866810035677098137442118133202648711418235887971712677520052011529633994;
    
    uint256 constant IC6x = 2297527124248723185900768082947951560643579283800365710842984965157264101840;
    uint256 constant IC6y = 9434206706541881044619636635270759408568552758696112311367886425341083598692;
    
    uint256 constant IC7x = 9122007675179559361780736064692556885820906643398113868883068400899322407495;
    uint256 constant IC7y = 18239692839436435460396561676446113010437228145075378416908199484299477259983;
    
    uint256 constant IC8x = 12069872841635152479826507283598153307214426182210430735404604769217389411036;
    uint256 constant IC8y = 1372723518616046552402020420413634447175532661337688071168075768345113800743;
    
    uint256 constant IC9x = 18937946080772458577053753919461761805458208979144850338225069569162223962931;
    uint256 constant IC9y = 14878690540027962193664776332468325720213220113150831095353969691186626873587;
    
    uint256 constant IC10x = 15108802336059892507797100149237456094973499603588789156391055312237452694049;
    uint256 constant IC10y = 4579334799410640759328999249226579288563479001195594505763769046425365183482;
    
    uint256 constant IC11x = 7119739390525078459535849368950364371637953754506231612661657197009298153094;
    uint256 constant IC11y = 9988703518150885938667657578767730168616125588181175820555411887218381160523;
    
    uint256 constant IC12x = 8940209424887762688949650812723042389386471767659040047141399731973615812067;
    uint256 constant IC12y = 1040119246853660717121801722058869335084291077726640651801414067893828083590;
    
    uint256 constant IC13x = 17808787187111209017767446435448929275855599179306714921430685098157732482466;
    uint256 constant IC13y = 8792220487238003150876087057584568571778632410579408369890806629256314936800;
    
    uint256 constant IC14x = 17300268608025353365629546414871305060813534887571422202005240395394793296770;
    uint256 constant IC14y = 15460527005152963205676604416226793365262298204187917708402184682061410713690;
    
    uint256 constant IC15x = 21240031868903018031776795821598927046371192715021745600469545982910439116545;
    uint256 constant IC15y = 20193550714534478294190790780267993554711418255760726465808361923485944108819;
    
    uint256 constant IC16x = 11561753906564444433893480322412471997355124458003636426344400940951739921883;
    uint256 constant IC16y = 1504755021231328786851132193497363410503746090469863969625394379855159203889;
    
    uint256 constant IC17x = 1643754526006769659111554438782417447852814893168398945800560703183440274836;
    uint256 constant IC17y = 6020496235326670510088538829594614124729095924614646168904163368994473613447;
    
    uint256 constant IC18x = 5363455441667059363127606416434573327420161653674257330571594949780399919572;
    uint256 constant IC18y = 18058223857087978885709311727735504363008365681904769437696881804526323606665;
    
    uint256 constant IC19x = 14281204509777516597308573631726173759093445306841094443584147314282674990657;
    uint256 constant IC19y = 21567290978202028669160397572399061341799940127569261876179812698456829486382;
    
    uint256 constant IC20x = 2378670379493790413820658284165657927322336895043297544083958457575303309124;
    uint256 constant IC20y = 19744043329102706936509568842521213257286154971351072957424925902293254105859;
    
    uint256 constant IC21x = 3045376236458134753534310013842786744574341523033856027921484049797980152037;
    uint256 constant IC21y = 8677741431089549133175619121334686962096854201712123390699690505712188448952;
    
    uint256 constant IC22x = 3044795679731231420472110219094921855618479927937955865074834365042705826469;
    uint256 constant IC22y = 20286868125683659046503458658541437220409395835222446408880452015938235585458;
    
    uint256 constant IC23x = 15584554267825838276852471051093890598993883969653767874612561228508116331057;
    uint256 constant IC23y = 3874806138171076926041893422647068605313815213731500039272709044512148166917;
    
    uint256 constant IC24x = 14444951344688826168517468824235340086293355150656019048850764605438942423862;
    uint256 constant IC24y = 7982940869591568023566635322138617865347344385555315076214983092292108053858;
    
    uint256 constant IC25x = 16399636290456750498946598632998286253340758996081676483396842600234002158693;
    uint256 constant IC25y = 5863815298251061424289387460640650932070479609068562123286862551808576483541;
    
    uint256 constant IC26x = 11289000941826898032828876923065292934682020970871058231903245699728521299050;
    uint256 constant IC26y = 1818533135640962433885153289797705841027624565482159363075015844580672981;
    
    uint256 constant IC27x = 19585243119084215000126416754637729757600687559383969364537295728426424514714;
    uint256 constant IC27y = 10783076142064339979384351086025880755645052822562198935914279753753647706730;
    
    uint256 constant IC28x = 18877719321382371149238015447259141691269187290201611144843940346622383187052;
    uint256 constant IC28y = 3802438019537169373109335425493591414957242677644988107826660066842092744971;
    
    uint256 constant IC29x = 17215660761651965044152392026062096619709388919121218255370564130998872502845;
    uint256 constant IC29y = 8444339463552754763559867412313905486540907509200983098665591096552056319403;
    
    uint256 constant IC30x = 9741785976742381533828464229851939651862970071137214925443759560872033652575;
    uint256 constant IC30y = 12115361004870531746096052017810634160110083102918930658768038122128556309995;
    
    uint256 constant IC31x = 3601424666540899258892020282432053113390796763024880306550641113572125630505;
    uint256 constant IC31y = 1445701907112372852762112267854019466516311213704359732384192068217069439511;
    
    uint256 constant IC32x = 2871086309879595233386329736260781772228330324071482270245477091845688669916;
    uint256 constant IC32y = 8412748825513292909210515920828317163738015255304744775344202382554951345584;
    
    uint256 constant IC33x = 21267019940740102735983413688161134766783652739221698883093662920030779473540;
    uint256 constant IC33y = 8979542948173707066219407938329299186462834363182438285751482471288016799159;
    
    uint256 constant IC34x = 1410851838203614776474414272670245347941224400699803031344450459552013337161;
    uint256 constant IC34y = 8656617125863325170364704138739345877442863210632488114178722923778138777613;
    
    uint256 constant IC35x = 16189972466807600691783826819033718659875375430692501148890526999403265550995;
    uint256 constant IC35y = 17014403739944738220828155798565513840813654283057357845923884711301460040728;
    
    uint256 constant IC36x = 2680561758640057230026803612675918983113738610102388536236712220009349097328;
    uint256 constant IC36y = 20021688598276763926775900583247178535258274714588030688209687483544161571209;
    
    uint256 constant IC37x = 5240052228778479659661951719497621493857786065425716460221778641239698589661;
    uint256 constant IC37y = 18114138808971434780553206453509156457883185016047468194265964419277607246873;
    
    uint256 constant IC38x = 7972160023607067742154086838186207329074018923158509101656760659341862764281;
    uint256 constant IC38y = 9743737066852528209212678395278927772528719621409206769027374169301586953061;
    
    uint256 constant IC39x = 15424629333173012720785345739170432695455799053795175911799760459148246226591;
    uint256 constant IC39y = 1032814008647198893680306234567003471935572606297599873717197345310915034873;
    
    uint256 constant IC40x = 19840293733618117806952256789140733281826003248345094325553246348777821434081;
    uint256 constant IC40y = 8167811199692647240223902734179769731708090647486686488943075987304629558176;
    
    uint256 constant IC41x = 15232189123608291682120603546180809517436826926770964272895950459650794194603;
    uint256 constant IC41y = 685979127255340274775557416448230806671091105567078480271881285665446758076;
    
    uint256 constant IC42x = 18448667055489504556389400760222943164252039826529569825430409853898877448914;
    uint256 constant IC42y = 12196894489415301732519508087945107881550868454714805247898897992197036075680;
    
    uint256 constant IC43x = 19396344812264838917701698545912379597669574818209707349608594118917088609585;
    uint256 constant IC43y = 10028526297811722840736529176430526133690087528568414624411288176973897384350;
    
    uint256 constant IC44x = 3718263388405669762004107748935094163399547460903931920277320649957194360667;
    uint256 constant IC44y = 19583056631031980574646484264062683903769354293270143883847208843999266961036;
    
    uint256 constant IC45x = 8031250532135230307828691535679188874716984944665448578944012828182744188087;
    uint256 constant IC45y = 8998828166084374033284985713759684855830214024066736572015523167075983515293;
    
    uint256 constant IC46x = 13248470413749509616031167286493455688222636970250547369932524489517485996699;
    uint256 constant IC46y = 16912627523712811731631311266778861510599684742070565221278844042147323701490;
    
    uint256 constant IC47x = 7307110628927276207097235574657695411243146521491402297765094769555609698670;
    uint256 constant IC47y = 14469835414700063045499480733931875726968041936078046547057804595455269870457;
    
    uint256 constant IC48x = 1190360658231818955174764375929026057851234122206952872175337984617699870911;
    uint256 constant IC48y = 7851615516090639545269122534145584366637512462727290404143884262376576026733;
    
    uint256 constant IC49x = 12953367864118034894006209925819151402192511736853397968866962837915015506316;
    uint256 constant IC49y = 15220011248080060039387492341037447400228269601964109291074153739770166175792;
    
    uint256 constant IC50x = 17057173912991528517332416375070763993956394963986141096231851007181346068971;
    uint256 constant IC50y = 11618647992518246839010210763892404663651128230525691098249399545305103887649;
    
    uint256 constant IC51x = 6521923418793802472000595132737924879037733617447495814358776137196778091013;
    uint256 constant IC51y = 16071073697017436181483001334508628643829984723172896784414291052950966080921;
    
 
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
